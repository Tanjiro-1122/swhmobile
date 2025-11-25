import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, ThumbsUp, Crown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    post_type: "pick",
    title: "",
    content: "",
    sport: "",
    pick: "",
    odds: "",
    confidence: "medium"
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.CommunityPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setDialogOpen(false);
      setNewPost({ post_type: "pick", title: "", content: "", sport: "", pick: "", odds: "", confidence: "medium" });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (post) => base44.entities.CommunityPost.update(post.id, { upvotes: (post.upvotes || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityPosts'] }),
  });

  const isVIPorLegacy = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';

  return (
    <div className="space-y-6">
      {/* Community Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🔥</div>
              <div>
                <h3 className="font-bold text-gray-900">Reddit Community</h3>
                <p className="text-sm text-gray-600">Join discussions on r/sportswagerhelper</p>
              </div>
            </div>
            <a 
              href="https://www.reddit.com/r/sportswagerhelper/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
            >
              Visit Reddit <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {isVIPorLegacy && (
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900">VIP Discord</h3>
                  <p className="text-sm text-gray-600">Exclusive channel for VIP members</p>
                </div>
              </div>
              <a 
                href="https://discord.gg/v6ZVC8MR" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                Join Discord <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Post */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Community Picks & Discussion</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Share a Pick
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Your Pick</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Sport</label>
                <Select value={newPost.sport} onValueChange={(v) => setNewPost({...newPost, sport: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NBA">NBA</SelectItem>
                    <SelectItem value="NFL">NFL</SelectItem>
                    <SelectItem value="MLB">MLB</SelectItem>
                    <SelectItem value="NHL">NHL</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <Input 
                  placeholder="e.g., Lakers vs Celtics - Best Bet"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Your Pick</label>
                <Input 
                  placeholder="e.g., Lakers -5.5"
                  value={newPost.pick}
                  onChange={(e) => setNewPost({...newPost, pick: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Analysis</label>
                <Textarea 
                  placeholder="Share your reasoning..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  rows={4}
                />
              </div>
              <Button 
                onClick={() => createPostMutation.mutate(newPost)}
                className="w-full"
                disabled={!newPost.title || !newPost.pick || !newPost.content}
              >
                Share Pick
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-gray-600">Be the first to share a pick!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.sport && <Badge variant="secondary">{post.sport}</Badge>}
                        <Badge className="bg-blue-100 text-blue-800">{post.post_type}</Badge>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                      {post.pick && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <span className="font-bold text-green-800">Pick: {post.pick}</span>
                          {post.odds && <span className="ml-2 text-green-700">({post.odds})</span>}
                        </div>
                      )}
                      <p className="text-gray-700">{post.content}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => upvoteMutation.mutate(post)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {post.upvotes || 0}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}