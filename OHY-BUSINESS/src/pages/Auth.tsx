import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ThemeToggle } from "@/components/theme-toggle";
import Footer from "@/components/Footer";

type AuthProps = {
  defaultTab?: "login" | "register";
};

const Auth = ({ defaultTab }: AuthProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    tabFromUrl === "register" ? "register" : defaultTab === "register" ? "register" : "login"
  );

  useEffect(() => {
    document.title = "Login | OHY Events";
    const desc = "Login or register to book and create events on OHY.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "register" || tabFromUrl === "login") {
      setActiveTab(tabFromUrl as "login" | "register");
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [searchParams, defaultTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register");
    setSearchParams(value === "register" ? { tab: "register" } : {}, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-16 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-xl p-8 rounded-3xl shadow-glow">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full bg-muted/60 p-1">
              <TabsTrigger value="login" className="rounded-full">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-full">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm embedded />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm embedded onRegistrationSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
