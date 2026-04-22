import { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ThumbsUp, MessageCircle, Plus, Filter, MessageSquare, Crown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from 'react-router-dom';
// Removed: import VIPDiscordCard from "../components/community/VIPDiscordCard";

// Add Reddit icon component at the top
const RedditIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

function CommunityContent() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSport, setFilterSport] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [newPost, setNewPost] = useState({
    post_type: "pick",
    title: "",
    content: "",
    sport: "",
    match_description: "",
    pick: "",
    odds: "",
    confidence: "medium"
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (_error) {
        // Return null if user is not authenticated or an error occurs
        // The RequireAuth component handles actual redirection, but this prevents
        // currentUser from being undefined if an error happens when logged out.
        return null;
      }
    },
  });

  const isVIPorLegacy = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';

  const { data: posts, isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.CommunityPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setDialogOpen(false);
      setNewPost({
        post_type: "pick",
        title: "",
        content: "",
        sport: "",
        match_description: "",
        pick: "",
        odds: "",
        confidence: "medium"
      });
    },
  });

  const upvotePostMutation = useMutation({
    mutationFn: ({ id, currentUpvotes }) =>
      base44.entities.CommunityPost.update(id, { upvotes: currentUpvotes + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  const handleCreatePost = () => {
    createPostMutation.mutate(newPost);
  };

  const filteredPosts = posts.filter(post => {
    const sportMatch = filterSport === "all" || post.sport === filterSport;
    const typeMatch = filterType === "all" || post.post_type === filterType;
    return sportMatch && typeMatch;
  });

  const getPostTypeColor = (type) => {
    switch(type) {
      case 'pick': return 'bg-green-100 text-green-800 border-green-300';
      case 'analysis': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'question': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'discussion': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch(confidence) {
      case 'high': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const discordInviteUrl = "https://discord.gg/2TswBjam";
  const redditUrl = "https://www.reddit.com/r/sportswagerhelper/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">Community Hub</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Connect with fellow bettors, share strategies, and learn from the community
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header - Share a Pick button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-end"
        >
          {currentUser && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Share a Pick
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Share with Community</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Post Type
                    </label>
                    <Select value={newPost.post_type} onValueChange={(value) => setNewPost({...newPost, post_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pick">🎯 Betting Pick</SelectItem>
                        <SelectItem value="analysis">📊 Analysis</SelectItem>
                        <SelectItem value="question">❓ Question</SelectItem>
                        <SelectItem value="discussion">💬 Discussion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <Input
                      placeholder="e.g., Lakers -5.5 vs Celtics - Lock of the Day"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>

                  {newPost.post_type === 'pick' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sport
                          </label>
                          <Input
                            placeholder="NBA, NFL, Soccer, etc."
                            value={newPost.sport}
                            onChange={(e) => setNewPost({...newPost, sport: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Odds
                          </label>
                          <Input
                            placeholder="-110, +150, etc."
                            value={newPost.odds}
                            onChange={(e) => setNewPost({...newPost, odds: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          The Pick
                        </label>
                        <Input
                          placeholder="e.g., Lakers -5.5, Over 225.5"
                          value={newPost.pick}
                          onChange={(e) => setNewPost({...newPost, pick: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confidence Level
                        </label>
                        <Select value={newPost.confidence} onValueChange={(value) => setNewPost({...newPost, confidence: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔥 High Confidence</SelectItem>
                            <SelectItem value="medium">⚡ Medium Confidence</SelectItem>
                            <SelectItem value="low">💡 Low Confidence</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {newPost.post_type === 'pick' ? 'Analysis & Reasoning' : 'Content'}
                    </label>
                    <Textarea
                      placeholder="Share your reasoning, analysis, or thoughts..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={handleCreatePost}
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700"
                    disabled={!newPost.title || !newPost.content}
                  >
                    Share Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Community Platforms */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Reddit Community Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 shadow-xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <RedditIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black mb-1">Join Us on Reddit</CardTitle>
                    <p className="text-sm text-orange-100">r/sportswagerhelper - Open to Everyone!</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      FREE FOR ALL
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Public Community
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Ask Questions & Get Help</div>
                        <div className="text-sm text-gray-600">Community-driven support and advice</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Share Your Picks & Strategies</div>
                        <div className="text-sm text-gray-600">Post your best bets and learn from others</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Feature Requests & Feedback</div>
                        <div className="text-sm text-gray-600">Help shape the future of the app</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Latest News & Updates</div>
                        <div className="text-sm text-gray-600">Stay informed about new features</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => window.open(redditUrl, '_blank')}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-lg py-6 shadow-lg"
                  >
                    <RedditIcon className="w-5 h-5 mr-2" />
                    Join r/sportswagerhelper
                  </Button>

                  <p className="text-xs text-center text-gray-500 mt-3">
                    🎯 Free community for all Sports Wager Helper users
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP Discord Card */}
          {isVIPorLegacy ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 shadow-xl overflow-hidden h-full">
                <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black mb-1">VIP Discord Channel</CardTitle>
                      <p className="text-sm text-purple-100">Exclusive for VIP & Legacy Members</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP ONLY
                      </Badge>
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        <Users className="w-3 h-3 mr-1" />
                        Private Community
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Advanced Strategy Discussions</div>
                          <div className="text-sm text-gray-600">Deep-dive into betting theory with pros</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Exclusive Picks & Insights</div>
                          <div className="text-sm text-gray-600">Members-only betting opportunities</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Direct Developer Access</div>
                          <div className="text-sm text-gray-600">Influence feature development directly</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Priority Support</div>
                          <div className="text-sm text-gray-600">Fastest response times from our team</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.open(discordInviteUrl, '_blank')}
                      className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold text-lg py-6 shadow-lg"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Join VIP Discord
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      👑 Exclusive access for VIP & Legacy members
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl overflow-hidden h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10" />
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-6 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black mb-1">VIP Discord Channel</CardTitle>
                      <p className="text-sm text-gray-300">Unlock with VIP or Legacy membership</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 relative">
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-semibold text-center">
                        🔒 Upgrade to VIP Annual to unlock exclusive Discord access
                      </p>
                    </div>

                    <div className="space-y-3 opacity-75">
                      <div className="flex items-start gap-3">
                        <Crown className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Advanced Strategy Discussions</div>
                          <div className="text-sm text-gray-600">VIP-only betting insights</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Crown className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Priority Support</div>
                          <div className="text-sm text-gray-600">Fastest response times</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.location.href = '/Pricing'}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6 shadow-lg"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Upgrade to VIP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 border-2 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pick">Betting Picks</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                  <SelectItem value="discussion">Discussions</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSport} onValueChange={setFilterSport}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600">Be the first to share a pick or start a discussion!</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Voting Section */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => upvotePostMutation.mutate({ id: post.id, currentUpvotes: post.upvotes || 0 })}
                          className="w-10 h-10 rounded-lg bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors"
                        >
                          <ThumbsUp className="w-5 h-5 text-orange-600" />
                        </button>
                        <span className="font-bold text-lg text-gray-900">{post.upvotes || 0}</span>
                      </div>

                      {/* Post Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPostTypeColor(post.post_type)}>
                              {post.post_type.toUpperCase()}
                            </Badge>
                            {post.sport && (
                              <Badge variant="outline">{post.sport}</Badge>
                            )}
                            {post.confidence && post.post_type === 'pick' && (
                              <Badge className={getConfidenceColor(post.confidence)}>
                                {post.confidence} confidence
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(post.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>

                        {post.post_type === 'pick' && post.pick && (
                          <div className="mb-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600 mb-1">The Pick:</div>
                                <div className="text-2xl font-black text-green-700">{post.pick}</div>
                              </div>
                              {post.odds && (
                                <div className="text-right">
                                  <div className="text-sm text-gray-600 mb-1">Odds:</div>
                                  <div className="text-xl font-bold text-gray-900">{post.odds}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count || 0} comments
                          </span>
                          <span>By {post.created_by}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  return (
    <RequireAuth pageName="Community">
      <CommunityContent />
    </RequireAuth>
  );
}