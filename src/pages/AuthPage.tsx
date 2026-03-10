import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroPattern from "@/assets/hero-pattern.jpg";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    school: "",
    faculty: "",
    department: "",
    bio: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && step === 1) {
      setStep(2);
      return;
    }
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={heroPattern}
          alt="Student Konnect abstract campus pattern"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h1 className="text-5xl font-bold font-display text-primary-foreground mb-4 tracking-tight">
            Student<br />Konnect
          </h1>
          <p className="font-body text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            A place for students to connect, share, and grow together — across departments, faculties, and schools.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">
              Student Konnect
            </h1>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-8 bg-accent rounded-md p-1">
            <button
              onClick={() => { setMode("login"); setStep(1); }}
              className={`flex-1 py-2.5 text-sm font-display font-medium rounded transition-colors ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setStep(1); }}
              className={`flex-1 py-2.5 text-sm font-display font-medium rounded transition-colors ${
                mode === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={`${mode}-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {mode === "login" && (
                <>
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
                      Welcome back
                    </h2>
                    <p className="text-sm text-muted-foreground font-body">
                      Sign in to continue to your campus.
                    </p>
                  </div>
                  <InputField label="Email" type="email" value={form.email} onChange={(v) => handleChange("email", v)} placeholder="you@university.edu" />
                  <InputField label="Password" type="password" value={form.password} onChange={(v) => handleChange("password", v)} placeholder="••••••••" />
                  <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-display font-semibold rounded-md hover:opacity-90 transition-opacity">
                    Sign In
                  </button>
                </>
              )}

              {mode === "register" && step === 1 && (
                <>
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
                      Create your account
                    </h2>
                    <p className="text-sm text-muted-foreground font-body">
                      Step 1 of 2 — Your basics.
                    </p>
                  </div>
                  <InputField label="Full Name" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="Amara Johnson" />
                  <InputField label="Username" value={form.username} onChange={(v) => handleChange("username", v)} placeholder="amara_j" />
                  <InputField label="Email" type="email" value={form.email} onChange={(v) => handleChange("email", v)} placeholder="you@university.edu" />
                  <InputField label="Password" type="password" value={form.password} onChange={(v) => handleChange("password", v)} placeholder="Min. 8 characters" />
                  <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-display font-semibold rounded-md hover:opacity-90 transition-opacity">
                    Continue
                  </button>
                </>
              )}

              {mode === "register" && step === 2 && (
                <>
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
                      Your campus details
                    </h2>
                    <p className="text-sm text-muted-foreground font-body">
                      Step 2 of 2 — Help others find you.
                    </p>
                  </div>
                  <InputField label="School / University" value={form.school} onChange={(v) => handleChange("school", v)} placeholder="University of Lagos" />
                  <InputField label="Faculty" value={form.faculty} onChange={(v) => handleChange("faculty", v)} placeholder="Engineering" />
                  <InputField label="Department" value={form.department} onChange={(v) => handleChange("department", v)} placeholder="Computer Science" />
                  <div>
                    <label className="block text-sm font-display font-medium text-foreground mb-1.5">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-accent text-accent-foreground font-display font-semibold rounded-md hover:opacity-90 transition-opacity">
                      Back
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground font-display font-semibold rounded-md hover:opacity-90 transition-opacity">
                      Create Account
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-display font-medium text-foreground mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

export default AuthPage;
