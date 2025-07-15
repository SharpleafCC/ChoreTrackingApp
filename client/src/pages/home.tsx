import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Plus, RefreshCw, Baby, Crown, Trophy, Medal, Check } from "lucide-react";
import type { Kid, Chore, Reward } from "@shared/schema";

const kidColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#FF9FF3", "#B19CD9", "#FFB347"];

export default function Home() {
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);
  const [isAddChoreModalOpen, setIsAddChoreModalOpen] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newChore, setNewChore] = useState({
    name: "",
    description: "",
    starValue: 1,
    type: "daily" as "daily" | "weekly",
    dueDate: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch kids
  const { data: kids = [], isLoading: kidsLoading } = useQuery<Kid[]>({
    queryKey: ["/api/kids"],
  });

  // Fetch chores for selected kid
  const { data: chores = [], isLoading: choresLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores", selectedKid?.id],
    enabled: !!selectedKid,
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  // Select first kid by default
  useEffect(() => {
    if (kids.length > 0 && !selectedKid) {
      setSelectedKid(kids[0]);
    }
  }, [kids, selectedKid]);

  // Add kid mutation
  const addKidMutation = useMutation({
    mutationFn: async (name: string) => {
      const color = kidColors[Math.floor(Math.random() * kidColors.length)];
      return apiRequest("POST", "/api/kids", { name, color, stars: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kids"] });
      setIsAddKidModalOpen(false);
      setNewKidName("");
      toast({ title: "Kid added successfully!" });
    },
  });

  // Add chore mutation
  const addChoreMutation = useMutation({
    mutationFn: async (chore: typeof newChore) => {
      return apiRequest("POST", "/api/chores", {
        ...chore,
        kidId: selectedKid!.id,
        completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores", selectedKid?.id] });
      setIsAddChoreModalOpen(false);
      setNewChore({ name: "", description: "", starValue: 1, type: "daily", dueDate: "" });
      toast({ title: "Chore added successfully!" });
    },
  });

  // Toggle chore completion
  const toggleChoreMutation = useMutation({
    mutationFn: async (choreId: number) => {
      return apiRequest("PATCH", `/api/chores/${choreId}/toggle`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores", selectedKid?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/kids"] });
      toast({ title: "Great job! ⭐" });
    },
  });

  // Reset weekly chores
  const resetWeeklyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reset-weekly", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({ title: "Weekly chores reset!" });
    },
  });

  const handleAddKid = () => {
    if (newKidName.trim()) {
      addKidMutation.mutate(newKidName.trim());
    }
  };

  const handleAddChore = () => {
    if (newChore.name.trim() && selectedKid) {
      addChoreMutation.mutate(newChore);
    }
  };

  const handleToggleChore = (choreId: number) => {
    toggleChoreMutation.mutate(choreId);
  };

  const dailyChores = chores.filter(chore => chore.type === "daily");
  const weeklyChores = chores.filter(chore => chore.type === "weekly");
  const completedChores = chores.filter(chore => chore.completed);
  const totalChores = chores.length;
  const progressPercent = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;

  if (kidsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-skyblue to-turquoise flex items-center justify-center">
        <div className="text-white text-xl font-fredoka">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-skyblue to-turquoise">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-sunny" />
              <h1 className="text-2xl font-fredoka text-gray-800">Chore Champions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isAddKidModalOpen} onOpenChange={setIsAddKidModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-coral hover:bg-coral/90 text-white font-semibold rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Kid
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Kid</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="kidName">Name</Label>
                      <Input
                        id="kidName"
                        value={newKidName}
                        onChange={(e) => setNewKidName(e.target.value)}
                        placeholder="Enter kid's name"
                      />
                    </div>
                    <Button onClick={handleAddKid} className="w-full bg-coral hover:bg-coral/90">
                      Add Kid
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => resetWeeklyMutation.mutate()}
                className="bg-orange hover:bg-orange/90 text-white font-semibold rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Week
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kids Selection Tab */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {kids.map((kid) => (
              <Button
                key={kid.id}
                onClick={() => setSelectedKid(kid)}
                variant={selectedKid?.id === kid.id ? "default" : "outline"}
                className={`px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all border-2 ${
                  selectedKid?.id === kid.id
                    ? "bg-white text-coral border-coral"
                    : "bg-white hover:bg-gray-50"
                }`}
                style={{ 
                  borderColor: kid.color,
                  color: selectedKid?.id === kid.id ? kid.color : undefined
                }}
              >
                <Baby className="w-4 h-4 mr-2" />
                {kid.name}
                <Badge className="ml-2 text-white" style={{ backgroundColor: kid.color }}>
                  {kid.stars}★
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {selectedKid && (
          <>
            {/* Progress Section */}
            <Card className="rounded-3xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-fredoka text-gray-800">{selectedKid.name}'s Progress</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-4xl font-fredoka" style={{ color: selectedKid.color }}>
                    {selectedKid.stars}
                  </span>
                  <Star className="w-8 h-8 text-sunny animate-pulse" />
                </div>
              </div>
              
              {/* Weekly Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">Weekly Goal</span>
                  <span className="text-lg font-semibold" style={{ color: selectedKid.color }}>
                    {completedChores.length} / {totalChores} Complete
                  </span>
                </div>
                <Progress value={progressPercent} className="h-4" />
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-sunny/20 text-yellow-700 px-4 py-2 rounded-full">
                  <Trophy className="w-4 h-4 mr-2" />
                  Super Helper
                </Badge>
                <Badge className="bg-mint/20 text-green-700 px-4 py-2 rounded-full">
                  <Medal className="w-4 h-4 mr-2" />
                  3 Days Streak
                </Badge>
                <Badge className="bg-lavender/20 text-purple-700 px-4 py-2 rounded-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Room Master
                </Badge>
              </div>
            </Card>

            {/* Chores Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Today's Chores */}
              <Card className="rounded-3xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-fredoka text-gray-800">Today's Chores</h3>
                  <Dialog open={isAddChoreModalOpen} onOpenChange={setIsAddChoreModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-coral hover:bg-coral/90 text-white font-semibold rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Chore
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Chore</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="choreName">Chore Name</Label>
                          <Input
                            id="choreName"
                            value={newChore.name}
                            onChange={(e) => setNewChore({ ...newChore, name: e.target.value })}
                            placeholder="Enter chore name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="choreDescription">Description</Label>
                          <Input
                            id="choreDescription"
                            value={newChore.description}
                            onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                            placeholder="Add a description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="starValue">Star Value</Label>
                          <Select value={newChore.starValue.toString()} onValueChange={(value) => setNewChore({ ...newChore, starValue: parseInt(value) })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select star value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Star</SelectItem>
                              <SelectItem value="2">2 Stars</SelectItem>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="4">4 Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="choreType">Type</Label>
                          <Select value={newChore.type} onValueChange={(value: "daily" | "weekly") => setNewChore({ ...newChore, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddChore} className="w-full bg-coral hover:bg-coral/90">
                          Add Chore
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-4">
                  {dailyChores.map((chore) => (
                    <ChoreCard
                      key={chore.id}
                      chore={chore}
                      onToggle={() => handleToggleChore(chore.id)}
                      color={selectedKid.color}
                    />
                  ))}
                  {dailyChores.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No daily chores yet. Add one to get started!
                    </div>
                  )}
                </div>
              </Card>

              {/* Weekly Chores */}
              <Card className="rounded-3xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-fredoka text-gray-800">Weekly Chores</h3>
                </div>
                
                <div className="space-y-4">
                  {weeklyChores.map((chore) => (
                    <ChoreCard
                      key={chore.id}
                      chore={chore}
                      onToggle={() => handleToggleChore(chore.id)}
                      color="#B19CD9"
                    />
                  ))}
                  {weeklyChores.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No weekly chores yet. Add one to get started!
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Rewards Section */}
        <Card className="rounded-3xl shadow-lg p-6 mt-8">
          <h3 className="text-2xl font-fredoka text-gray-800 mb-6">Rewards Store</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${reward.color}, ${reward.color}dd)` }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {reward.icon === "ice-cream" && "🍦"}
                    {reward.icon === "gamepad" && "🎮"}
                    {reward.icon === "bicycle" && "🚴"}
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{reward.name}</h4>
                  <p className="text-sm opacity-90 mb-4">{reward.description}</p>
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="w-4 h-4 text-white" />
                    <span className="font-semibold">{reward.starCost} stars</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}

function ChoreCard({ chore, onToggle, color }: { chore: Chore; onToggle: () => void; color: string }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    onToggle();
  };

  return (
    <Card
      className={`rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 ${
        isAnimating ? "animate-bounce" : ""
      }`}
      style={{ 
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        opacity: chore.completed ? 0.75 : 1
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleToggle}
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full border-2 border-white hover:bg-white hover:text-current transition-colors ${
              chore.completed ? "bg-white text-current" : ""
            }`}
          >
            {chore.completed && <Check className="w-4 h-4" />}
          </Button>
          <div>
            <h4 className={`font-semibold text-lg ${chore.completed ? "line-through" : ""}`}>
              {chore.name}
            </h4>
            <p className="text-sm opacity-90">
              {chore.completed ? "Completed! Great job!" : chore.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex">
            {Array.from({ length: chore.starValue }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-sunny fill-current" />
            ))}
          </div>
          <span className="text-sm font-semibold">{chore.starValue}★</span>
        </div>
      </div>
    </Card>
  );
}
