# Deployment Considerations

This file contains implementation considerations and strategies for each project release.

## [1.9.0] - 2026-03-04

### Deployment Strategy & Considerations
1. **Environment Variables**:
   - Set `BREVO_API_KEY` in Supabase Secrets.
   - `RESEND_API_KEY` can be safely removed from Supabase Secrets.
2. **Edge Functions**: Redeploy `send-contact-email`.
3. **Verification**: Confirm that the "Coming Soon" signup still works as expected with the new HTML confirmation email.

## [1.8.0] - 2026-03-04

### Deployment Strategy & Considerations
> **Information**: This version introduces the feature flag for production launch control, enhanced AI prompt for meeting preparation, and service provider tracking.

1. **Environment Variables**:
   - Set `VITE_COMING_SOON=true` in production to show the landing page. Change to `false` when ready to go live.
   - Ensure `CONTACT_EMAIL` is configured in Supabase Secrets.
2. **Edge Functions**: Redeploy `prepare-meeting`. It now uses the shared `MeetingPrepService` which includes the new AI prompt for more concrete numerical analysis and sub-category awareness.
3. **Frontend**: Deploy the web application. Verify that `Proximamente.tsx` loads when the flag is enabled.

## [1.7.0] - 2026-02-22

### Deployment Strategy & Considerations
> **Information**: This version introduces hierarchical market benchmarks, advanced mathematical consistency checks, and standardized diagnostic UI.

1. **Database (SQL Migration)**: Execute `20260222190000_add_expense_subcategories` and `20260223000000_add_expense_type_to_subcategories.sql` to add the `expense_type` column to subcategories.
2. **Edge Functions**: Redeploy the following functions:
   - `get-buildings-trend`: Implements the new hierarchical fallback logic (Neighborhood -> City -> Zone).
   - `process-expense`: Includes the updated AI prompt and programmatic mathematical validation of subcategories.
3. **Frontend**: Deploy the web application. Verify that the "EvolutionComparisonChart" displays the applied filters badge correctly.

## [1.6.0] - 2026-02-19

### Deployment Strategy & Considerations
> **Information**: This version fixes consistency issues in comparative charts across all sections.

1. **Frontend**: Deploy the web application.


## [1.5.0] - 2026-02-19

### Deployment Strategy & Considerations
> **Information**: This version introduces comprehensive SEO optimizations for the Argentine market.

1. **Frontend**: Deploy the web application.

## [1.4.0] - 2026-02-18

### Deployment Strategy & Considerations
> **Information**: This version introduces security improvements for cache tables.

1. **Database (SQL Migration)**: A new security migration `20260218160000_secure_building_profiles_cache.sql` has been added to enable Row Level Security (RLS) on all cache tables. Execute the following in the SQL Editor if not using Supabase CLI:
2. **Frontend**: Deploy the web application.

## [1.3.0] - 2026-02-18

### Deployment Strategy & Considerations
> **Information**: This version introduces retries for expense analysis.

1. **Edge Functions**: Redeploy the following functions to apply the new retry logic:
   - `process-expense`: Handles the retry logic for expense analysis.
   - `get-shared-analysis`: Updated to support the retry logic.
2. **Frontend**: Deploy the web application.

## [1.2.0] - 2026-02-17

### Deployment Strategy & Considerations
> **Information**: This version introduces performance optimizations, contextual filtering for market benchmarks, and header UI standardization.

1. **Database (SQL Migration)**: A new migration file `20260217194500_add_performance_indexes.sql` has been added. If not using the Supabase CLI, execute the following in the SQL Editor:
2. **Edge Functions**: Redeploy the following functions to apply the new caching and contextual filtering logic:
   - `get-buildings-trend`: Handles the optimized market comparison with building profile attributes.
   - `fetch-inflation`: Updated to support internal caching mechanisms.
3. **Frontend**: Deploy the web application. Verify that the history page correctly displays the "Showing X of Y" indicator and that headers are consistent across legal pages.

## [1.1.1] - 2026-02-17

### Deployment Strategy & Considerations
> **Critical**: This version requires manual data migration in the Supabase Dashboard.

1. **Edge Functions**: Deploy `process-expense` update to handle building profile linking.
2. **Data Migration**: Run the following SQL script in the Supabase SQL Editor for all projects:
   ```sql
   -- 1. Create missing profiles
   INSERT INTO public.building_profiles (user_id, building_name)
   SELECT DISTINCT user_id, building_name
   FROM public.expense_analyses
   WHERE building_name IS NOT NULL
   ON CONFLICT (user_id, building_name) DO NOTHING;

   -- 2. Link analyses via normalized names
   UPDATE public.expense_analyses ea
   SET building_profile_id = bp.id
   FROM public.building_profiles bp
   WHERE ea.user_id = bp.user_id
     AND LOWER(TRIM(ea.building_name)) = LOWER(TRIM(bp.building_name))
     AND ea.building_profile_id IS NULL;
   ```
3. **Frontend**: Deploy frontend changes to support the updated `Analysis` interface.

## [1.1.0] - 2026-02-16

### Deployment Strategy & Considerations
> **Warning**: To avoid desynchronization between the frontend and backend, follow this specific order:

1. **Edge Functions**: Deploy `process-expense` and `mercadopago-webhook` first. Ensure `MERCADOPAGO_ACCESS_TOKEN` is configured in the production environment.
2. **Storage**: Verify that the `expense-files` bucket exists in Production and has RLS policies allowing authenticated users to upload and read their files.
3. **Frontend**: Deploy the web application last.
4. **Data Integrity**: Note that existing 'pending' analyses will now appear in the History page, allowing users to retry interrupted processes. No SQL migrations are required for this release.

