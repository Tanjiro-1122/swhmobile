
import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ThumbsUp, MessageCircle, Plus, TrendingUp, Trophy, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";

function CommunityContent() {
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
    queryFn: () => base44.auth.me(),
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Community</h1>
                <p className="text-gray-600">Share picks and insights with fellow bettors</p>
              </div>
            </div>

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
          </div>
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
