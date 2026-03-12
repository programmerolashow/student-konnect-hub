import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { users, currentUser, User } from "@/lib/mock-data";
import { Search, UserPlus, UserCheck, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "department" | "faculty" | "school";

const allUsers = [...users];

// Extract unique values for filters
const departments = [...new Set(allUsers.map((u) => u.department))];
const faculties = [...new Set(allUsers.map((u) => u.faculty))];
const schools = [...new Set(allUsers.map((u) => u.school))];

const ConnectionsView = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set(["u2", "u4"]));

  const filtered = useMemo(() => {
    let result = allUsers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.school.toLowerCase().includes(q)
      );
    }

    if (filterType === "department" && selectedDepartment) {
      result = result.filter((u) => u.department === selectedDepartment);
    } else if (filterType === "faculty" && selectedFaculty) {
      result = result.filter((u) => u.faculty === selectedFaculty);
    } else if (filterType === "school" && selectedSchool) {
      result = result.filter((u) => u.school === selectedSchool);
    }

    return result;
  }, [search, filterType, selectedDepartment, selectedFaculty, selectedSchool]);

  const toggleConnect = (userId: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterType("all");
    setSelectedDepartment(null);
    setSelectedFaculty(null);
    setSelectedSchool(null);
    setSearch("");
  };

  const hasActiveFilter = filterType !== "all" || search.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">
            Discover Students
          </h2>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs font-display text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, department..."
            className="pl-9 font-body text-sm bg-muted/50 border-border"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            active={filterType === "all"}
            onClick={() => setFilterType("all")}
          />
          <FilterChip
            label="Department"
            active={filterType === "department"}
            onClick={() => setFilterType("department")}
          />
          <FilterChip
            label="Faculty"
            active={filterType === "faculty"}
            onClick={() => setFilterType("faculty")}
          />
          <FilterChip
            label="School"
            active={filterType === "school"}
            onClick={() => setFilterType("school")}
          />
        </div>

        {/* Sub-filter select */}
        {filterType === "department" && (
          <div className="flex flex-wrap gap-1.5">
            {departments.map((d) => (
              <Badge
                key={d}
                variant={selectedDepartment === d ? "default" : "outline"}
                className="cursor-pointer font-display text-xs"
                onClick={() => setSelectedDepartment(selectedDepartment === d ? null : d)}
              >
                {d}
              </Badge>
            ))}
          </div>
        )}
        {filterType === "faculty" && (
          <div className="flex flex-wrap gap-1.5">
            {faculties.map((f) => (
              <Badge
                key={f}
                variant={selectedFaculty === f ? "default" : "outline"}
                className="cursor-pointer font-display text-xs"
                onClick={() => setSelectedFaculty(selectedFaculty === f ? null : f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        )}
        {filterType === "school" && (
          <div className="flex flex-wrap gap-1.5">
            {schools.map((s) => (
              <Badge
                key={s}
                variant={selectedSchool === s ? "default" : "outline"}
                className="cursor-pointer font-display text-xs"
                onClick={() => setSelectedSchool(selectedSchool === s ? null : s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <p className="text-xs font-display text-muted-foreground mb-3">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <StudentCard
                user={user}
                connected={connectedIds.has(user.id)}
                onToggleConnect={() => toggleConnect(user.id)}
              />
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body text-sm">No students match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-display font-medium rounded-full border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);

const StudentCard = ({
  user,
  connected,
  onToggleConnect,
}: {
  user: User;
  connected: boolean;
  onToggleConnect: () => void;
}) => (
  <div className="border border-border rounded-lg p-4 bg-card hover:border-foreground/20 transition-colors">
    <div className="flex items-start gap-3">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-concrete flex items-center justify-center text-sm font-display font-semibold text-foreground">
          {user.name.charAt(0)}
        </div>
        {user.online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              @{user.username}
            </p>
          </div>
          <Button
            size="sm"
            variant={connected ? "secondary" : "default"}
            className="flex-shrink-0 text-xs font-display h-8 gap-1"
            onClick={onToggleConnect}
          >
            {connected ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {connected ? "Connected" : "Connect"}
          </Button>
        </div>
        <p className="text-xs font-body text-muted-foreground mt-1.5 line-clamp-1">
          {user.bio}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="text-[10px] font-display">
            {user.department}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-display">
            {user.school}
          </Badge>
        </div>
      </div>
    </div>
  </div>
);

export default ConnectionsView;
