export class ComparisonService {
  static normalizeForComparison(str: string): string {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
      .trim();
  }

  static findMatchingBuilding(
    extractedName: string,
    existingNames: string[]
  ): string | null {
    const extractedNormalized = this.normalizeForComparison(extractedName);

    // Extract numbers to ensure they match (crucial for building addresses)
    const getNumbers = (s: string) => s.match(/\d+/g)?.join("") || "";
    const extractedNumbers = getNumbers(extractedNormalized);

    const matchingBuilding = existingNames.find(existingName => {
      const existingNormalized = this.normalizeForComparison(existingName);
      const existingNumbers = getNumbers(existingNormalized);

      // Rule 1: Numeric safety. If both have numbers and they differ, they are likely different buildings
      // (e.g., "Rivadavia 100" vs "Rivadavia 200")
      if (extractedNumbers && existingNumbers && extractedNumbers !== existingNumbers) {
        return false;
      }

      // Exact match after normalization
      if (extractedNormalized === existingNormalized) {
        return true;
      }

      // Rule 2: High overlap requirement
      // Handles minor differences like "Edificio" vs "Edif."
      if (extractedNormalized.includes(existingNormalized) || existingNormalized.includes(extractedNormalized)) {
        const shorter = Math.min(extractedNormalized.length, existingNormalized.length);
        const longer = Math.max(extractedNormalized.length, existingNormalized.length);

        // Increased threshold from 0.5 to 0.85 for "contains" matching
        // to be much more selective and avoid matching different buildings in the same street
        if (shorter / longer > 0.85) {
          return true;
        }
      }

      // Rule 3: Levenshtein-like similarity for typos (very strict)
      if (Math.abs(extractedNormalized.length - existingNormalized.length) <= 1) { // reduced from 2
        let differences = 0;
        const maxLen = Math.max(extractedNormalized.length, existingNormalized.length);
        for (let i = 0; i < maxLen; i++) {
          if (extractedNormalized[i] !== existingNormalized[i]) {
            differences++;
          }
        }
        // Allow only 1 difference for building names (more critical than general text)
        if (differences <= 1 && maxLen > 8) {
          return true;
        }
      }

      return false;
    });

    return matchingBuilding || null;
  }

  static calculateBuildingsTrend(
    analyses: Array<{ period: string; total_amount: number; building_name: string; user_id?: string }>,
    excludeBuilding?: string,
    excludeUserId?: string
  ) {
    // Exclude current building only if it belongs to the current user
    const otherBuildings = analyses.filter((a) => {
      const isSameBuilding = a.building_name?.toLowerCase().trim() === excludeBuilding?.toLowerCase().trim();
      const isSameUser = a.user_id === excludeUserId;

      // Exclude only if BOTH conditions are met (it's the same building AND same user)
      return !(isSameBuilding && isSameUser);
    });

    // Group by period and calculate average
    const periodMap = new Map<string, { total: number; count: number; buildings: Set<string> }>();

    for (const analysis of otherBuildings as any[]) {
      const period = analysis.period;
      if (!periodMap.has(period)) {
        periodMap.set(period, { total: 0, count: 0, buildings: new Set() });
      }
      const entry = periodMap.get(period)!;

      let amount = analysis.total_amount;

      // If categories are included (from a join), find the relevant one
      if (analysis.expense_categories) {
        const categories = Array.isArray(analysis.expense_categories)
          ? analysis.expense_categories
          : [analysis.expense_categories];

        // Since the query filtered by category name, we can just take the first one
        if (categories.length > 0) {
          amount = (categories[0] as any).current_amount;
        }
      }

      entry.total += amount;
      entry.count++;
      entry.buildings.add(analysis.building_name);
    }

    const buildingsTrend = Array.from(periodMap.entries())
      .map(([period, data]: [string, any]) => ({
        period,
        average: Math.round(data.total / data.count),
        count: data.count,
        buildingsCount: data.buildings.size
      }))
      .sort((a, b) => this.parseDate(a.period).valueOf() - this.parseDate(b.period).valueOf());

    // Calculate normalized percentage change from first period
    if (buildingsTrend.length > 0) {
      const baseValue = buildingsTrend[0].average;
      for (const item of buildingsTrend) {
        (item as any).normalizedPercent = ((item.average - baseValue) / baseValue) * 100;
      }
    }

    return {
      trend: buildingsTrend,
      stats: {
        totalBuildings: new Set(otherBuildings.map((a) => a.building_name)).size,
        totalAnalyses: otherBuildings.length,
        periodsCount: buildingsTrend.length,
        filtersApplied: false,
        usedFallback: false
      }
    };
  }

  private static parseDate(period: string): Date {
    const monthsEs: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    const parts = period.toLowerCase().split(" ");

    if (parts.length >= 2) {
      const month = monthsEs[parts[0]] ?? 0;
      const year = parseInt(parts[1]) || 2024;
      const date = new Date(year, month);
      return date;
    }

    return new Date();
  }

  static periodToYearMonth(period: string): string {
    // Check if period is already in YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(period)) {
      return period;
    }

    // Otherwise, parse Spanish format like "enero 2024"
    const date = this.parseDate(period);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
