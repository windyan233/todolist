'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Trash2,
  Check,
  Circle,
  Star,
  Calendar,
  Sparkles,
  Zap,
  Clock,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Edit2,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  important: boolean;
  createdAt: Date;
  imageUrl?: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // 获取任务列表
  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setTodos(data.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.is_completed,
          important: todo.is_important,
          createdAt: new Date(todo.created_at),
          imageUrl: todo.image_url
        })));
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // 检查用户登录状态
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
      if (user) {
        fetchTodos();
      } else {
        setTodos([]);
      }
    };

    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchTodos();
      } else {
        setTodos([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 实时数据同步
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`, // 只监听当前用户的数据
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTodo = payload.new;
            setTodos((prev) => {
              // 防止重复添加（本地乐观更新可能已经添加了）
              if (prev.some((t) => t.id === newTodo.id)) return prev;
              return [
                ...prev,
                {
                  id: newTodo.id,
                  text: newTodo.text,
                  completed: newTodo.is_completed,
                  important: newTodo.is_important,
                  createdAt: new Date(newTodo.created_at),
                  imageUrl: newTodo.image_url,
                },
              ];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTodo = payload.new;
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === updatedTodo.id
                  ? {
                      id: updatedTodo.id,
                      text: updatedTodo.text,
                      completed: updatedTodo.is_completed,
                      important: updatedTodo.is_important,
                      createdAt: new Date(updatedTodo.created_at),
                      imageUrl: updatedTodo.image_url,
                    }
                  : todo
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTodos((prev) => prev.filter((todo) => todo.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  // 退出登录
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTodos([]);
    router.refresh();
  };

  const addTodo = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (inputValue.trim()) {
      try {
        setIsUploading(true);
        let imageUrl = null;

        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('todolist-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('todolist-files')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }

        const { data, error } = await supabase
          .from('todos')
          .insert([
            {
              text: inputValue,
              user_id: user.id,
              is_completed: false,
              is_important: false,
              image_url: imageUrl
            }
          ])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setTodos([
            ...todos,
            {
              id: data.id,
              text: data.text,
              completed: data.is_completed,
              important: data.is_important,
              createdAt: new Date(data.created_at),
              imageUrl: data.image_url
            },
          ]);
          setInputValue('');
          setFile(null);
        }
      } catch (error) {
        console.error('Error adding todo:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  const saveEdit = async () => {
    if (editingId && editValue.trim()) {
      try {
        const { error } = await supabase
          .from('todos')
          .update({ text: editValue })
          .eq('id', editingId);

        if (error) throw error;

        setTodos(
          todos.map((todo) =>
            todo.id === editingId ? { ...todo, text: editValue } : todo
          )
        );
        setEditingId(null);
        setEditValue('');
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;

      setTodos(
        todos.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const toggleImportant = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_important: !todo.important })
        .eq('id', id);

      if (error) throw error;

      setTodos(
        todos.map((t) =>
          t.id === id ? { ...t, important: !t.important } : t
        )
      );
    } catch (error) {
      console.error('Error toggling important:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const importantCount = todos.filter((t) => t.important && !t.completed).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 w-full py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-end gap-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-xl text-white font-medium flex items-center gap-2 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                退出登录
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-xl text-white font-medium flex items-center gap-2 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                  登录
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5" />
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-yellow-400 animate-bounce" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Super Todo
            </h1>
            <Zap className="w-10 h-10 text-yellow-400 animate-bounce delay-150" />
          </div>
          <p className="text-purple-200 text-lg font-light">
            让每一天都充满效率与惊喜 ✨
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/30 rounded-xl">
                <Clock className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">总任务</p>
                <p className="text-3xl font-bold text-white">{todos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/30 rounded-xl">
                <Check className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-green-200 text-sm">已完成</p>
                <p className="text-3xl font-bold text-white">{completedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/30 rounded-xl">
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-yellow-200 text-sm">重要任务</p>
                <p className="text-3xl font-bold text-white">{importantCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isUploading && addTodo()}
                placeholder="添加一个新任务..."
                className="w-full px-6 py-4 bg-white/20 border-2 border-white/30 rounded-2xl text-white placeholder-purple-200 focus:outline-none focus:border-purple-400 focus:bg-white/30 transition-all duration-300 text-lg pr-12"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setFile(files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    file ? 'bg-purple-500 text-white' : 'text-purple-300 hover:bg-white/10'
                  }`}
                  title={file ? file.name : "上传图片"}
                >
                  <ImageIcon className="w-6 h-6" />
                </label>
              </div>
            </div>
            <button
              onClick={addTodo}
              disabled={isUploading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
              {isUploading ? '上传中' : '添加'}
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 bg-white/10 backdrop-blur-lg rounded-full mb-4">
                <Sparkles className="w-16 h-16 text-purple-300" />
              </div>
              <p className="text-purple-200 text-xl">还没有任务，开始添加吧！</p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.id}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                      todo.completed
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-400 shadow-lg shadow-green-500/50'
                        : 'border-purple-400 hover:border-purple-300 hover:bg-white/10'
                    }`}
                  >
                    {todo.completed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-purple-300" />
                    )}
                  </button>

                  {/* Todo Text */}
                  {editingId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1 rounded-lg hover:bg-green-500/30 text-green-300 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded-lg hover:bg-red-500/30 text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`flex-1 text-lg transition-all duration-300 ${
                        todo.completed
                          ? 'text-purple-300 line-through'
                          : 'text-white font-medium'
                      }`}
                      onDoubleClick={() => startEditing(todo)}
                    >
                      {todo.text}
                      {todo.imageUrl && (
                        <div className="mt-2 relative group max-w-xs">
                          <img
                            src={todo.imageUrl}
                            alt="Attachment"
                            className="rounded-lg border-2 border-white/20 shadow-md transition-transform hover:scale-105"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {!editingId && (
                      <button
                        onClick={() => startEditing(todo)}
                        className="p-2 rounded-xl hover:bg-blue-500/30 text-blue-300 transition-all duration-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleImportant(todo.id)}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        todo.important
                          ? 'bg-yellow-500/30 text-yellow-300 shadow-lg shadow-yellow-500/30'
                          : 'hover:bg-white/10 text-purple-300'
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          todo.important ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 rounded-xl hover:bg-red-500/30 text-red-300 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </main>
  );
}
