import { useState } from "react";
import { Sparkles, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/ui/logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Proximamente = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Por favor, ingresá un mail válido.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.functions.invoke("send-contact-email", {
                body: {
                    name: "Interesado Lanzamiento",
                    email: email,
                    subject: "lanzamiento",
                    message: `Este usuario quiere recibir novedades del lanzamiento oficial de ExpensaCheck (Email: ${email})`,
                },
            });

            if (error) throw error;

            toast.success("¡Genial! Te avisaremos apenas estemos en vivo.");
            setEmail("");
        } catch (error: any) {
            console.error("Error signing up for waitlist:", error);
            toast.error("No pudimos registrarte. Por favor, reintentá pronto.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse duration-1000"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="p-6 md:p-10 flex items-center justify-center md:justify-start gap-3">
                <Logo className="w-10 h-10" />
                <span className="text-3xl font-black tracking-tight bg-clip-text text-foreground">
                    ExpensaCheck
                </span>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center container max-w-4xl text-center px-4">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase font-black text-xs tracking-widest mb-10 shadow-lg shadow-primary/5 animate-fade-in-up">
                    <Sparkles className="w-4 h-4" />
                    <span>Lanzamiento Oficial</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 animate-fade-in-up md:leading-[1.1]">
                    Estamos preparando algo <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient">Revolucionario</span>
                </h1>

                <p className="text-lg md:text-2xl text-muted-foreground font-medium mb-12 max-w-2xl animate-fade-in-up leading-relaxed">
                    La inteligencia artificial está a punto de cambiar cómo analizás las expensas. Estamos ultimando detalles para darte el control total.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-lg mb-6 animate-fade-in-up">
                    <div className="relative w-full group">
                        <input
                            type="email"
                            placeholder="Tu email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-16 px-6 bg-background/50 border-2 border-border/50 rounded-full text-lg font-medium focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                        />
                        <div className="absolute inset-0 -z-10 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>

                    <div className="relative group w-full sm:w-auto flex-shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            variant="hero"
                            className="w-full sm:w-auto relative rounded-full px-10 h-16 font-black text-lg shadow-2xl shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Bell className="w-5 h-5 mr-3" />
                                    Notificarme
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <p className="text-sm text-muted-foreground font-medium animate-fade-in-up opacity-60">
                    No spam. Solo el aviso de cuando el sistema esté listo para vos.
                </p>
            </main>

            {/* Footer */}
            <footer className="p-8 text-center border-t border-border/20 bg-background/50 backdrop-blur-xl">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">&copy; {new Date().getFullYear()} ExpensaCheck. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default Proximamente;
