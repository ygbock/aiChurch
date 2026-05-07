import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Smile, 
  Send,
  UserPlus,
  TrendingUp,
  Hash,
  Sparkles,
  Users,
  Search,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  image?: string;
  likes: number;
  commentsCount: number;
  time: string;
  isLiked?: boolean;
  tags?: string[];
}

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: { name: 'Pastor David Wilson', role: 'Head Pastor', initials: 'DW' },
    content: "What a powerful service we had today! The message on 'Walking in Grace' reminded us all that God's love is sufficient in every season. Let's carry this spirit into the week ahead.",
    likes: 124,
    commentsCount: 18,
    time: '2h ago',
    tags: ['SundayService', 'Grace'],
    image: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    author: { name: 'Sarah Jenkins', role: 'Choir Lead', initials: 'SJ' },
    content: "Choir rehearsal tonight at 6 PM! We're preparing something special for the upcoming revival. See you all there! 🎶",
    likes: 45,
    commentsCount: 7,
    time: '5h ago',
    tags: ['Worship', 'Choir']
  },
  {
    id: '3',
    author: { name: 'James Oloyede', role: 'Youth Ministry', initials: 'JO' },
    content: "Prayer Request: Please join me in praying for our university students as they begin their final exams this week. Strength and clarity of mind for every one of them.",
    likes: 89,
    commentsCount: 24,
    time: 'Yesterday',
    isLiked: true
  }
];

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const navigate = useNavigate();

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: { name: 'You', role: 'Member', initials: 'ME' },
      content: newPostContent,
      likes: 0,
      commentsCount: 0,
      time: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    toast.success('Post shared with the community!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-2 md:py-8 w-full max-w-full"
    >
      {/* Social Tab Navigation */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-6 md:gap-8 border-b border-slate-200 mb-6 md:mb-8 overflow-x-auto no-scrollbar w-[calc(100%+32px)] md:w-full">
        {[
          { label: 'Community Feed', path: '/community-feed', mobileOnly: false },
          { label: 'Ministry Channels', path: '/ministry-channels', mobileOnly: false },
          { label: 'Direct Messages', path: '/direct-messages', mobileOnly: false },
          { label: 'Announcements', path: '/communication', mobileOnly: true }
        ].map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`shrink-0 pb-4 text-sm font-bold transition-all whitespace-nowrap relative ${
              tab.mobileOnly ? 'md:hidden' : ''
            } ${
              location.pathname === tab.path 
                ? 'text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {location.pathname === tab.path && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Create Post */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                ME
              </div>
              <div className="flex-1">
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a word of encouragement or a prayer request..."
                  className="w-full border-none focus:ring-0 text-slate-700 bg-slate-50 rounded-xl p-4 min-h-[100px] resize-none text-sm font-medium placeholder:text-slate-400"
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <ImageIcon size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Hash size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Smile size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={handlePostSubmit}
                    disabled={!newPostContent.trim()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    Post <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Posts */}
          <div className="space-y-6">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.article 
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                          {post.author.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.author.role} • {post.time}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.image && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                        <img src={post.image} alt="Post content" className="w-full h-auto" />
                      </div>
                    )}

                    {post.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 text-xs font-bold transition-all ${post.isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                      >
                        <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
                        <MessageCircle size={18} />
                        {post.commentsCount}
                      </button>
                      <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all ml-auto">
                        <Share2 size={18} />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Trending */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trending in Community</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'SundayService', posts: '1.2k' },
                { label: 'SpringRetreat24', posts: '850' },
                { label: 'YouthNight', posts: '420' },
                { label: 'WorshipTeam', posts: '310' }
              ].map(topic => (
                <div key={topic.label} className="group cursor-pointer">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{topic.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{topic.posts} posts</p>
                </div>
              ))}
            </div>
          </div>

          {/* New Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="text-emerald-500" size={18} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Suggested Connections</h3>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Michael Chen', role: 'New Member', initials: 'MC' },
                { name: 'Grace Adebayo', role: 'Protocol Team', initials: 'GA' }
              ].map(member => (
                <div key={member.name} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <UserPlus size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
              View All Members
            </button>
          </div>

          {/* Ministry Channels Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ministry Channels</h3>
              </div>
              <button 
                onClick={() => navigate('/ministry-channels')}
                className="text-[10px] font-black text-indigo-600 hover:underline"
              >
                OPEN CHAT
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Announcements', count: 0 },
                { name: 'WorshipTeam', count: 2 },
                { name: 'YouthMinistry', count: 0 },
                { name: 'Volunteers', count: 1 }
              ].map(channel => (
                <div 
                  key={channel.name} 
                  onClick={() => navigate('/ministry-channels')}
                  className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium group-hover:text-indigo-600">#</span>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{channel.name}</span>
                  </div>
                  {channel.count > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {channel.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ministry Pulse */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Insight</span>
              </div>
              <h4 className="text-lg font-black leading-tight mb-2">Member engagement is up 24% this week!</h4>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">Keep sharing your testimonies and requests. Our community is stronger together.</p>
            </div>
            <Users className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
