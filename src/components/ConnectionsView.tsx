import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Search, UserPlus, UserCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FilterType = "all" | "department" | "faculty" | "school";

const ConnectionsView = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profilesData } = await supabase.from("profiles").select("*").neq("user_id", user?.id || "");
      setProfiles(profilesData || []);

      if (user) {
        const { data: connections } = await supabase
          .from("connections")
          .select("*")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq("status", "accepted");
        const ids = new Set<string>();
        connections?.forEach((c) => {
          if (c.requester_id === user.id) ids.add(c.addressee_id);
          else ids.add(c.requester_id);
        });
        setConnectedIds(ids);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const departments = useMemo(() => [...new Set(profiles.map((p) => p.department).filter(Boolean))], [profiles]);
  const faculties = useMemo(() => [...new Set(profiles.map((p) => p.faculty).filter(Boolean))], [profiles]);
  const schools = useMemo(() => [...new Set(profiles.map((p) => p.school).filter(Boolean))], [profiles]);

  const filtered = useMemo(() => {
    let result = profiles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.school.toLowerCase().includes(q));
    }
    if (filterType === "department" && selectedDepartment) result = result.filter((u) => u.department === selectedDepartment);
    else if (filterType === "faculty" && selectedFaculty) result = result.filter((u) => u.faculty === selectedFaculty);
    else if (filterType === "school" && selectedSchool) result = result.filter((u) => u.school === selectedSchool);
    return result;
  }, [profiles, search, filterType, selectedDepartment, selectedFaculty, selectedSchool]);

  const toggleConnect = async (profileUserId: string) => {
    if (!user) return;
    if (connectedIds.has(profileUserId)) {
      await supabase.from("connections").delete().or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},addressee_id.eq.${user.id})`);
      setConnectedIds((prev) => { const n = new Set(prev); n.delete(profileUserId); return n; });
      toast.info("Disconnected");
    } else {
      await supabase.from("connections").insert({ requester_id: user.id, addressee_id: profileUserId, status: "accepted" });
      setConnectedIds((prev) => new Set(prev).add(profileUserId));
      toast.success("Connected!");
    }
  };

  const clearFilters = () => { setFilterType("all"); setSelectedDepartment(null); setSelectedFaculty(null); setSelectedSchool(null); setSearch(""); };
  const hasActiveFilter = filterType !== "all" || search.length > 0;

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground font-display">Loading...</p></div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">Discover Students</h2>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs font-display text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username, department..." className="pl-9 font-body text-sm bg-muted/50 border-border" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "department", "faculty", "school"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1 text-xs font-display font-medium rounded-full border transition-colors ${filterType === f ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filterType === "department" && <div className="flex flex-wrap gap-1.5">{departments.map((d) => <Badge key={d} variant={selectedDepartment === d ? "default" : "outline"} className="cursor-pointer font-display text-xs" onClick={() => setSelectedDepartment(selectedDepartment === d ? null : d)}>{d}</Badge>)}</div>}
        {filterType === "faculty" && <div className="flex flex-wrap gap-1.5">{faculties.map((f) => <Badge key={f} variant={selectedFaculty === f ? "default" : "outline"} className="cursor-pointer font-display text-xs" onClick={() => setSelectedFaculty(selectedFaculty === f ? null : f)}>{f}</Badge>)}</div>}
        {filterType === "school" && <div className="flex flex-wrap gap-1.5">{schools.map((s) => <Badge key={s} variant={selectedSchool === s ? "default" : "outline"} className="cursor-pointer font-display text-xs" onClick={() => setSelectedSchool(selectedSchool === s ? null : s)}>{s}</Badge>)}</div>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <p className="text-xs font-display text-muted-foreground mb-3">{filtered.length} student{filtered.length !== 1 ? "s" : ""} found</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}>
              <div className="border border-border rounded-lg p-4 bg-card hover:border-foreground/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-concrete flex items-center justify-center text-sm font-display font-semibold text-foreground">{p.name.charAt(0)}</div>
                    )}
                    {p.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-sm text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-body">@{p.username}</p>
                      </div>
                      <Button size="sm" variant={connectedIds.has(p.user_id) ? "secondary" : "default"} className="flex-shrink-0 text-xs font-display h-8 gap-1" onClick={() => toggleConnect(p.user_id)}>
                        {connectedIds.has(p.user_id) ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        {connectedIds.has(p.user_id) ? "Connected" : "Connect"}
                      </Button>
                    </div>
                    <p className="text-xs font-body text-muted-foreground mt-1.5 line-clamp-1">{p.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.department && <Badge variant="outline" className="text-[10px] font-display">{p.department}</Badge>}
                      {p.school && <Badge variant="outline" className="text-[10px] font-display">{p.school}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground font-body text-sm">No students found yet. Be the first to invite friends!</p></div>}
      </div>
    </div>
  );
};

export default ConnectionsView;
