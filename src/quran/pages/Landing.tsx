
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "@/quran/components/landing/Navigation";
import { Loader2, BookOpen, GraduationCap, Users, ArrowRight } from "lucide-react";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { supabase } from "@/quran/lib/supabase";
import { handleSignOut } from "@/quran/lib/authUtils";
import { Card, CardContent } from "@/quran/components/ui/card";
import { Button } from "@/quran/components/ui/button";

const Landing = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { userRole, isLoading: isRoleLoading } = useUserRole();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    if (error.message.includes('Invalid Refresh Token')) {
                        await supabase.auth.signOut();
                        setIsAuthenticated(false);
                        navigate('/quran/login');
                        return;
                    }
                    throw error;
                }

                setIsAuthenticated(!!session);

                if (session && userRole && !isRoleLoading) {
                    redirectBasedOnRole(userRole);
                }
            } catch (error: any) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                setIsAuthenticated(true);
                setTimeout(() => {
                    if (userRole && !isRoleLoading) {
                        redirectBasedOnRole(userRole);
                    }
                }, 500);
            } else if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
            }
        });

        const redirectBasedOnRole = (role: string | null) => {
            if (!role) return;

            if (role === 'admin' || role === 'teacher') {
                navigate('/quran/dashboard');
            } else if (role === 'parent') {
                navigate('/quran/parent-dashboard');
            } else if (role === 'student') {
                navigate('/quran/student');
            }
        };

        checkAuth();

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, userRole, isRoleLoading]);

    useEffect(() => {
        if (isAuthenticated && userRole && !isRoleLoading) {
            if (userRole === 'admin' || userRole === 'teacher') {
                navigate('/quran/dashboard');
            } else if (userRole === 'parent') {
                navigate('/quran/parent-dashboard');
            } else if (userRole === 'student') {
                navigate('/quran/student');
            }
        }
    }, [isAuthenticated, userRole, isRoleLoading, navigate]);

    const handleUserSignOut = async () => {
        await handleSignOut(navigate);
        setIsAuthenticated(false);
    };

    if (isLoading || (isAuthenticated && isRoleLoading)) {
        return (
            <div className="min-h-screen bg-quran-bg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-quran-bg/90"></div>
            </div>

            <Navigation isAuthenticated={isAuthenticated} onSignOut={handleUserSignOut} />

            {/* Hero Content */}
            <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 text-center">
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-outfit font-bold text-white tracking-tight drop-shadow-2xl">
                            Iqra Dugsi
                            <span className="block text-quran-secondary mt-2">Quran Tracking</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-outfit font-light tracking-wide max-w-2xl mx-auto">
                            Empowering your journey in memorization and understanding
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto text-lg h-14 px-8 bg-quran-primary hover:bg-quran-primary/90 text-white border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                            onClick={() => navigate('/quran/login')}
                        >
                            Access Portal <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-quran-secondary/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                <GraduationCap className="w-8 h-8 text-quran-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-outfit">For Teachers</h3>
                            <p className="text-white/80 leading-relaxed">
                                Efficiently guide students, track hifz progress, and provide precise tajweed feedback.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-quran-secondary/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="w-8 h-8 text-quran-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-outfit">For Students</h3>
                            <p className="text-white/80 leading-relaxed">
                                Visualize your progress, review assigned lessons, and stay motivated on your path.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-quran-secondary/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8 text-quran-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-outfit">For Parents</h3>
                            <p className="text-white/80 leading-relaxed">
                                Stay connected with your child's education and celebrate their milestones together.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Landing;
