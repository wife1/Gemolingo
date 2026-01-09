import React, { useState, useEffect, useRef } from 'react';
import { UserState, SUPPORTED_LANGUAGES, Difficulty, Lesson, LanguageConfig } from '../types';
import { Button } from './UI';
import { DailyGoalWidget } from './DailyGoalWidget';
import { Star, Zap, Trophy, Flame, Download, Check, Trash2, Loader2, WifiOff, Globe, Timer, Crown, Store, ChevronDown, Signal, Upload, Filter, ArrowUpDown, HelpCircle, FileJson, X, Languages, Search, AlertTriangle, CloudDownload, Files, Info, Dumbbell, RefreshCw, GripVertical, Settings } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onStartLesson: (topicId: string, topicName: string) => void;
  onStartPractice: () => void;
  onChangeLanguage: (code: string) => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onToggleTimer: () => void;
  offlineLessons: Record<string, Record<string, Lesson>>;
  onDownload: (topicId: string, topicName: string) => Promise<void>;
  onDeleteDownload: (topicId: string) => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  onResetTopic: (topicId: string) => void;
  onReorderTopics: (newOrder: string[]) => void;
  downloadingId: string | null;
  isOffline: boolean;
  onImportLanguage: (lang: LanguageConfig) => void;
  onImportLanguages?: (langs: LanguageConfig[]) => void;
  onImportLessonData: (data: any) => void;
}

export const TOPICS = [
  { id: 'basics', name: 'Basics', icon: '🥚', color: 'bg-green-500', description: 'Master essential words and simple phrases.' },
  { id: 'greetings', name: 'Greetings', icon: '👋', color: 'bg-blue-500', description: 'Learn to say hello, goodbye, and introduce yourself.' },
  { id: 'food', name: 'Food', icon: '🍎', color: 'bg-red-500', description: 'Order meals and discuss food preferences.' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'bg-purple-500', description: 'Vocabulary for airports, hotels, and tourism.' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: 'bg-yellow-500', description: 'Talk about family members and relationships.' },
  { id: 'hobbies', name: 'Hobbies', icon: '🎨', color: 'bg-pink-500', description: 'Discuss your interests and free time activities.' },
  { id: 'work', name: 'Work', icon: '💼', color: 'bg-indigo-500', description: 'Professional vocabulary for the workplace.' },
  { id: 'weather', name: 'Weather', icon: '☀️', color: 'bg-orange-500', description: 'Talk about the climate and weather conditions.' },
  { id: 'emotions', name: 'Emotions', icon: '😊', color: 'bg-teal-500', description: 'Express your feelings and moods.' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'bg-rose-500', description: 'Navigate stores, prices, and products.' },
  { id: 'animals', name: 'Animals', icon: '🐶', color: 'bg-green-600', description: 'Learn the names of pets and wildlife.' },
  { id: 'home', name: 'Home', icon: '🏠', color: 'bg-orange-600', description: 'Describe your house and furniture.' },
  { id: 'school', name: 'School', icon: '🏫', color: 'bg-blue-600', description: 'Classroom vocabulary and subjects.' },
  { id: 'health', name: 'Health', icon: '🏥', color: 'bg-red-600', description: 'Discuss symptoms and medical care.' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: 'bg-yellow-600', description: 'Talk about games, teams, and exercise.' },
  { id: 'nature', name: 'Nature', icon: '🌳', color: 'bg-emerald-600', description: 'Explore the outdoors and environment.' },
  { id: 'tech', name: 'Technology', icon: '💻', color: 'bg-indigo-600', description: 'Computers, internet, and gadgets.' },
  { id: 'time', name: 'Time & Dates', icon: '⏰', color: 'bg-purple-600', description: 'Tell time, days, and months.' },
  { id: 'culture', name: 'Arts & Culture', icon: '🎭', color: 'bg-pink-600', description: 'Art, music, and traditions.' },
  { id: 'numbers', name: 'Numbers', icon: '🔢', color: 'bg-cyan-600', description: 'Counting and mathematics basics.' },
  { id: 'fashion', name: 'Fashion', icon: '👗', color: 'bg-pink-500', description: 'Clothing styles and trends.' },
  { id: 'directions', name: 'Directions', icon: '🗺️', color: 'bg-blue-500', description: 'Ask for and give ways to go.' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-500', description: 'Movies, TV, and fun activities.' },
  { id: 'government', name: 'Government', icon: '🏛️', color: 'bg-gray-500', description: 'Politics and civic structures.' },
  { id: 'environment', name: 'Environment', icon: '♻️', color: 'bg-green-500', description: 'Sustainability and nature.' },
  { id: 'science', name: 'Science', icon: '🔬', color: 'bg-indigo-500', description: 'Scientific concepts and discovery.' },
  { id: 'history', name: 'History', icon: '📜', color: 'bg-yellow-600', description: 'Past events and eras.' },
  { id: 'internet', name: 'Internet', icon: '🌐', color: 'bg-cyan-500', description: 'Web browsing and online life.' },
  { id: 'emergency', name: 'Emergency', icon: '🚑', color: 'bg-red-600', description: 'Urgent situations and help.' },
  { id: 'holidays', name: 'Holidays', icon: '🎉', color: 'bg-orange-500', description: 'Celebrations and special days.' },
  { id: 'music', name: 'Music', icon: '🎵', color: 'bg-pink-600', description: 'Instruments and musical styles.' },
  { id: 'space', name: 'Space', icon: '🚀', color: 'bg-indigo-700', description: 'Planets, stars, and the universe.' },
  { id: 'business', name: 'Business', icon: '🤝', color: 'bg-slate-500', description: 'Corporate terms and commerce.' },
  { id: 'cooking', name: 'Cooking', icon: '🍳', color: 'bg-orange-600', description: 'Recipes and kitchen techniques.' },
  { id: 'social_media', name: 'Social Media', icon: '📱', color: 'bg-blue-400', description: 'Networking and online trends.' },
  { id: 'architecture', name: 'Architecture', icon: '🏗️', color: 'bg-stone-500', description: 'Buildings and design styles.' },
  { id: 'literature', name: 'Literature', icon: '📚', color: 'bg-amber-700', description: 'Books, authors, and reading.' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: 'bg-red-500', description: 'Workouts and physical health.' },
  { id: 'transport', name: 'Transport', icon: '🚌', color: 'bg-yellow-500', description: 'Vehicles and public transit.' },
  { id: 'relationships', name: 'Relationships', icon: '💘', color: 'bg-rose-500', description: 'Love, dating, and friends.' },
  { id: 'mythology', name: 'Mythology', icon: '🧜‍♀️', color: 'bg-purple-600', description: 'Legends and ancient stories.' },
  { id: 'philosophy', name: 'Philosophy', icon: '🧠', color: 'bg-indigo-500', description: 'Ideas and critical thinking.' },
  { id: 'journalism', name: 'Journalism', icon: '📰', color: 'bg-gray-500', description: 'News and reporting.' },
  { id: 'gardening', name: 'Gardening', icon: '🌻', color: 'bg-green-500', description: 'Plants and growing food.' },
  { id: 'camping', name: 'Camping', icon: '⛺', color: 'bg-emerald-600', description: 'Outdoor living and survival.' },
  { id: 'photography', name: 'Photography', icon: '📷', color: 'bg-zinc-500', description: 'Cameras and taking photos.' },
  { id: 'law', name: 'Law & Justice', icon: '⚖️', color: 'bg-stone-600', description: 'Legal terms and rights.' },
  { id: 'astronomy', name: 'Astronomy', icon: '🔭', color: 'bg-blue-800', description: 'Stargazing and celestial bodies.' },
  { id: 'geography', name: 'Geography', icon: '🌍', color: 'bg-cyan-600', description: 'Maps and world regions.' },
  { id: 'psychology', name: 'Psychology', icon: '🧩', color: 'bg-teal-500', description: 'The mind and behavior.' },
  { id: 'banking', name: 'Banking', icon: '🏦', color: 'bg-emerald-700', description: 'Money and financial services.' },
  { id: 'real_estate', name: 'Real Estate', icon: '🏘️', color: 'bg-orange-500', description: 'Buying and selling homes.' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', color: 'bg-red-600', description: 'Cars and mechanics.' },
  { id: 'pets', name: 'Pets', icon: '🐈', color: 'bg-yellow-600', description: 'Caring for animal companions.' },
  { id: 'nightlife', name: 'Nightlife', icon: '🍸', color: 'bg-fuchsia-600', description: 'Parties and evening fun.' },
  { id: 'volunteering', name: 'Volunteering', icon: '🤝', color: 'bg-rose-500', description: 'Helping others and charity.' },
  { id: 'traditions', name: 'Traditions', icon: '🏮', color: 'bg-red-500', description: 'Customs and cultural heritage.' },
  { id: 'weddings', name: 'Weddings', icon: '💍', color: 'bg-pink-400', description: 'Marriage ceremonies.' },
  { id: 'childhood', name: 'Childhood', icon: '🧸', color: 'bg-sky-400', description: 'Growing up and play.' },
  { id: 'retirement', name: 'Retirement', icon: '👴', color: 'bg-slate-500', description: 'Life after work.' },
  { id: 'archaeology', name: 'Archaeology', icon: '🏺', color: 'bg-amber-700', description: 'Ancient history and artifacts.' },
  { id: 'genetics', name: 'Genetics', icon: '🧬', color: 'bg-rose-400', description: 'DNA and heredity.' },
  { id: 'robotics', name: 'Robotics', icon: '🤖', color: 'bg-slate-600', description: 'Machines and automation.' },
  { id: 'oceanography', name: 'Oceanography', icon: '🌊', color: 'bg-blue-700', description: 'Sea life and oceans.' },
  { id: 'geology', name: 'Geology', icon: '🪨', color: 'bg-stone-600', description: 'Rocks and earth science.' },
  { id: 'paleontology', name: 'Paleontology', icon: '🦖', color: 'bg-green-800', description: 'Dinosaurs and fossils.' },
  { id: 'anthropology', name: 'Anthropology', icon: '🦴', color: 'bg-orange-700', description: 'Human societies and cultures.' },
  { id: 'sociology', name: 'Sociology', icon: '👥', color: 'bg-yellow-600', description: 'Social behavior and groups.' },
  { id: 'economics', name: 'Economics', icon: '📉', color: 'bg-emerald-600', description: 'Markets and resources.' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: 'bg-purple-500', description: 'Advertising and brands.' },
  { id: 'management', name: 'Management', icon: '📋', color: 'bg-blue-500', description: 'Leading teams and projects.' },
  { id: 'public_speaking', name: 'Public Speaking', icon: '🎙️', color: 'bg-red-500', description: 'Presentations and speeches.' },
  { id: 'debate', name: 'Debate', icon: '🗣️', color: 'bg-orange-500', description: 'Arguments and discussions.' },
  { id: 'logic', name: 'Logic', icon: '💡', color: 'bg-yellow-400', description: 'Reasoning and puzzles.' },
  { id: 'ethics', name: 'Ethics', icon: '😇', color: 'bg-indigo-500', description: 'Moral values and choices.' },
  { id: 'poetry', name: 'Poetry', icon: '✒️', color: 'bg-pink-400', description: 'Verses and rhyme.' },
  { id: 'theater', name: 'Theater', icon: '🎭', color: 'bg-red-700', description: 'Stage plays and drama.' },
  { id: 'cinema', name: 'Film Studies', icon: '🎥', color: 'bg-gray-800', description: 'Movies and filmmaking.' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉', color: 'bg-purple-700', description: 'Magic and imaginary worlds.' },
  { id: 'scifi', name: 'Sci-Fi', icon: '👽', color: 'bg-green-400', description: 'Future tech and aliens.' },
  { id: 'mystery', name: 'Mystery', icon: '🕵️', color: 'bg-slate-700', description: 'Secrets and detective work.' },
  { id: 'comedy', name: 'Comedy', icon: '🤡', color: 'bg-yellow-500', description: 'Humor and jokes.' },
  { id: 'painting', name: 'Painting', icon: '🖌️', color: 'bg-orange-400', description: 'Visual arts and canvas.' },
  { id: 'sculpture', name: 'Sculpture', icon: '🗿', color: 'bg-stone-400', description: 'Statues and 3D art.' },
  { id: 'pottery', name: 'Pottery', icon: '🏺', color: 'bg-orange-800', description: 'Ceramics and clay.' },
  { id: 'origami', name: 'Origami', icon: '🦢', color: 'bg-pink-200', description: 'Paper folding art.' },
  { id: 'graphic_design', name: 'Graphic Design', icon: '📐', color: 'bg-indigo-400', description: 'Visual communication.' },
  { id: 'coding', name: 'Coding', icon: '👨‍💻', color: 'bg-slate-800', description: 'Programming and software.' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒', color: 'bg-red-800', description: 'Online safety and protection.' },
  { id: 'ai', name: 'AI', icon: '🧠', color: 'bg-cyan-400', description: 'Artificial Intelligence concepts.' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'bg-violet-600', description: 'Video games and culture.' },
  { id: 'streaming', name: 'Streaming', icon: '📡', color: 'bg-red-600', description: 'Live broadcasting online.' },
  { id: 'podcasting', name: 'Podcasting', icon: '🎧', color: 'bg-purple-600', description: 'Audio content creation.' },
  { id: 'nutrition', name: 'Nutrition', icon: '🥗', color: 'bg-green-400', description: 'Healthy eating habits.' },
  { id: 'yoga', name: 'Yoga', icon: '🧘', color: 'bg-teal-400', description: 'Flexibility and mindfulness.' },
  { id: 'meditation', name: 'Meditation', icon: '🕉️', color: 'bg-indigo-300', description: 'Mental peace and focus.' },
  { id: 'martial_arts', name: 'Martial Arts', icon: '🥋', color: 'bg-stone-800', description: 'Self-defense techniques.' },
  { id: 'swimming', name: 'Swimming', icon: '🏊', color: 'bg-cyan-500', description: 'Water sports and safety.' },
  { id: 'running', name: 'Running', icon: '🏃', color: 'bg-orange-500', description: 'Jogging and racing.' },
  { id: 'chess', name: 'Chess', icon: '♟️', color: 'bg-gray-700', description: 'Strategy board games.' },
  { id: 'board_games', name: 'Board Games', icon: '🎲', color: 'bg-red-400', description: 'Tabletop fun and dice.' },
  { id: 'magic', name: 'Magic', icon: '🎩', color: 'bg-purple-900', description: 'Tricks and illusions.' },
  { id: 'knitting', name: 'Knitting', icon: '🧶', color: 'bg-pink-600', description: 'Yarn crafts and patterns.' },
  { id: 'woodworking', name: 'Woodworking', icon: '🪚', color: 'bg-amber-800', description: 'Carpentry and building.' },
  { id: 'interior_design', name: 'Interior Design', icon: '🛋️', color: 'bg-rose-300', description: 'Decorating spaces.' },
  { id: 'farming', name: 'Farming', icon: '🚜', color: 'bg-green-700', description: 'Agriculture and crops.' },
  { id: 'astrology', name: 'Astrology', icon: '♈', color: 'bg-violet-800', description: 'Zodiac signs and stars.' },
  { id: 'medieval', name: 'Medieval History', icon: '🏰', color: 'bg-slate-500', description: 'Castles and knights.' },
  { id: 'renaissance', name: 'Renaissance', icon: '🎨', color: 'bg-amber-500', description: 'Artistic rebirth era.' },
  { id: 'industrial', name: 'Industrial Rev', icon: '🏭', color: 'bg-gray-600', description: 'Factories and steam power.' },
  { id: 'politics', name: 'Politics', icon: '🗳️', color: 'bg-blue-600', description: 'Government and elections.' },
  { id: 'human_rights', name: 'Human Rights', icon: '✊', color: 'bg-yellow-500', description: 'Equality and justice.' },
  { id: 'sustainability', name: 'Sustainability', icon: '🌱', color: 'bg-green-500', description: 'Eco-friendly living.' },
  { id: 'renewable_energy', name: 'Renewable Energy', icon: '🔋', color: 'bg-lime-500', description: 'Clean power sources.' },
  { id: 'zoology', name: 'Zoology', icon: '🦓', color: 'bg-orange-300', description: 'Study of animals.' },
  { id: 'botany', name: 'Botany', icon: '🌺', color: 'bg-pink-500', description: 'Study of plants.' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-green-400', description: 'Elements and reactions.' },
  { id: 'physics', name: 'Physics', icon: '⚛️', color: 'bg-blue-800', description: 'Matter and energy.' },
  { id: 'biology', name: 'Biology', icon: '🦠', color: 'bg-emerald-500', description: 'Life and organisms.' },
  { id: 'algebra', name: 'Algebra', icon: '✖️', color: 'bg-red-500', description: 'Variables and equations.' },
  { id: 'geometry', name: 'Geometry', icon: '🔺', color: 'bg-blue-400', description: 'Shapes and spaces.' },
  { id: 'calculus', name: 'Calculus', icon: '∫', color: 'bg-indigo-600', description: 'Change and motion math.' },
  { id: 'statistics', name: 'Statistics', icon: '📊', color: 'bg-yellow-600', description: 'Data analysis and probability.' },
  { id: 'anatomy', name: 'Anatomy', icon: '🦴', color: 'bg-stone-300', description: 'Body structure and organs.' },
  { id: 'medicine', name: 'Medicine', icon: '💊', color: 'bg-red-400', description: 'Healing and treatments.' },
  { id: 'dentistry', name: 'Dentistry', icon: '🦷', color: 'bg-blue-200', description: 'Teeth and oral health.' },
  { id: 'surgery', name: 'Surgery', icon: '😷', color: 'bg-teal-600', description: 'Operations and procedures.' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '⚕️', color: 'bg-green-600', description: 'Drugs and medications.' },
  { id: 'veterinary', name: 'Veterinary', icon: '🐾', color: 'bg-yellow-700', description: 'Animal healthcare.' },
  { id: 'nursing', name: 'Nursing', icon: '🩺', color: 'bg-pink-300', description: 'Patient care and support.' },
  { id: 'mental_health', name: 'Mental Health', icon: '🧠', color: 'bg-indigo-200', description: 'Emotional well-being.' },
  { id: 'self_care', name: 'Self Care', icon: '🛀', color: 'bg-cyan-200', description: 'Relaxation and wellness.' },
  { id: 'productivity', name: 'Productivity', icon: '⚡', color: 'bg-yellow-400', description: 'Efficiency and goals.' },
  { id: 'investing', name: 'Investing', icon: '💹', color: 'bg-green-700', description: 'Stocks and growth.' },
  { id: 'crypto', name: 'Crypto', icon: '🪙', color: 'bg-orange-400', description: 'Digital currencies.' },
  { id: 'accounting', name: 'Accounting', icon: '📒', color: 'bg-gray-500', description: 'Financial records.' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'bg-blue-700', description: 'Risk protection.' },
  { id: 'taxes', name: 'Taxes', icon: '🧾', color: 'bg-red-300', description: 'Government contributions.' },
  { id: 'logistics', name: 'Logistics', icon: '🚚', color: 'bg-slate-600', description: 'Supply chain and transport.' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', color: 'bg-gray-700', description: 'Production and factories.' },
  { id: 'impressionism', name: 'Impressionism', icon: '🎨', color: 'bg-pink-400', description: 'Light and color art.' },
  { id: 'surrealism', name: 'Surrealism', icon: '👁️', color: 'bg-purple-400', description: 'Dreamlike art styles.' },
  { id: 'calligraphy', name: 'Calligraphy', icon: '🖋️', color: 'bg-stone-700', description: 'Beautiful writing.' },
  { id: 'opera', name: 'Opera', icon: '🎭', color: 'bg-red-800', description: 'Theatrical singing.' },
  { id: 'jazz', name: 'Jazz', icon: '🎷', color: 'bg-amber-700', description: 'Swing and improvisation.' },
  { id: 'rock_n_roll', name: 'Rock & Roll', icon: '🎸', color: 'bg-slate-800', description: 'Electric guitars and beats.' },
  { id: 'hip_hop', name: 'Hip Hop', icon: '🎤', color: 'bg-fuchsia-600', description: 'Rap and urban culture.' },
  { id: 'classical_music', name: 'Classical Music', icon: '🎻', color: 'bg-yellow-700', description: 'Orchestras and symphonies.' },
  { id: 'animation', name: 'Animation', icon: '🎞️', color: 'bg-blue-400', description: 'Cartoons and motion.' },
  { id: 'filmmaking', name: 'Filmmaking', icon: '🎬', color: 'bg-gray-900', description: 'Directing and editing.' },
  { id: 'quantum_mechanics', name: 'Quantum Mechanics', icon: '⚛️', color: 'bg-indigo-900', description: 'Subatomic physics.' },
  { id: 'neuroscience', name: 'Neuroscience', icon: '🧠', color: 'bg-pink-600', description: 'Brain and nervous system.' },
  { id: 'nanotech', name: 'Nanotech', icon: '🔬', color: 'bg-cyan-700', description: 'Microscopic technology.' },
  { id: 'meteorology', name: 'Meteorology', icon: '🌩️', color: 'bg-blue-600', description: 'Weather forecasting.' },
  { id: 'marine_biology', name: 'Marine Biology', icon: '🐙', color: 'bg-teal-600', description: 'Underwater life.' },
  { id: 'entomology', name: 'Entomology', icon: '🐞', color: 'bg-red-500', description: 'Study of insects.' },
  { id: 'mycology', name: 'Mycology', icon: '🍄', color: 'bg-amber-600', description: 'Mushrooms and fungi.' },
  { id: 'ornithology', name: 'Ornithology', icon: '🐦', color: 'bg-sky-500', description: 'Study of birds.' },
  { id: 'seismology', name: 'Seismology', icon: '🌋', color: 'bg-orange-700', description: 'Earthquakes and volcanoes.' },
  { id: 'forensics', name: 'Forensics', icon: '🕵️‍♂️', color: 'bg-slate-600', description: 'Crime scene science.' },
  { id: 'rugby', name: 'Rugby', icon: '🏉', color: 'bg-green-700', description: 'Scrum and tackle sport.' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', color: 'bg-red-700', description: 'Bat and ball game.' },
  { id: 'baseball', name: 'Baseball', icon: '⚾', color: 'bg-blue-700', description: 'Pitching and home runs.' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'bg-orange-600', description: 'Hoops and dribbling.' },
  { id: 'golf', name: 'Golf', icon: '⛳', color: 'bg-green-500', description: 'Clubs and courses.' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', color: 'bg-yellow-400', description: 'Rackets and serves.' },
  { id: 'boxing', name: 'Boxing', icon: '🥊', color: 'bg-red-600', description: 'Ring fighting sport.' },
  { id: 'surfing', name: 'Surfing', icon: '🏄', color: 'bg-cyan-400', description: 'Waves and boards.' },
  { id: 'skateboarding', name: 'Skateboarding', icon: '🛹', color: 'bg-stone-500', description: 'Tricks and ramps.' },
  { id: 'skiing', name: 'Skiing', icon: '🎿', color: 'bg-blue-300', description: 'Snow slopes and speed.' },
  { id: 'data_science', name: 'Data Science', icon: '📉', color: 'bg-indigo-600', description: 'Analytics and big data.' },
  { id: 'machine_learning', name: 'Machine Learning', icon: '🤖', color: 'bg-emerald-500', description: 'Algorithms and training.' },
  { id: 'cloud_computing', name: 'Cloud Computing', icon: '☁️', color: 'bg-sky-400', description: 'Remote servers and AWS.' },
  { id: 'web_development', name: 'Web Development', icon: '🌐', color: 'bg-orange-500', description: 'Building websites.' },
  { id: 'mobile_apps', name: 'Mobile Apps', icon: '📱', color: 'bg-purple-500', description: 'iOS and Android dev.' },
  { id: 'ux_design', name: 'UX Design', icon: '🖌️', color: 'bg-pink-500', description: 'User experience flow.' },
  { id: 'product_mgmt', name: 'Product Mgmt', icon: '📋', color: 'bg-blue-500', description: 'Roadmaps and strategy.' },
  { id: 'sales', name: 'Sales', icon: '🤝', color: 'bg-green-600', description: 'Selling and closing deals.' },
  { id: 'negotiation', name: 'Negotiation', icon: '⚖️', color: 'bg-gray-600', description: 'Deals and agreements.' },
  { id: 'leadership', name: 'Leadership', icon: '👔', color: 'bg-slate-700', description: 'Guiding teams.' },
  { id: 'minimalism', name: 'Minimalism', icon: '🧹', color: 'bg-stone-300', description: 'Living with less.' },
  { id: 'zero_waste', name: 'Zero Waste', icon: '♻️', color: 'bg-green-400', description: 'Reducing trash.' },
  { id: 'veganism', name: 'Veganism', icon: '🥦', color: 'bg-emerald-400', description: 'Plant-based lifestyle.' },
  { id: 'parenting', name: 'Parenting', icon: '🍼', color: 'bg-yellow-200', description: 'Raising children.' },
  { id: 'elderly_care', name: 'Elderly Care', icon: '👵', color: 'bg-gray-400', description: 'Supporting seniors.' },
  { id: 'home_improvement', name: 'Home Improvement', icon: '🔨', color: 'bg-orange-800', description: 'Renovating your space.' },
  { id: 'diy', name: 'DIY', icon: '🔧', color: 'bg-slate-500', description: 'Do it yourself projects.' },
  { id: 'sewing', name: 'Sewing', icon: '🧵', color: 'bg-pink-300', description: 'Stitching and fabric.' },
  { id: 'baking', name: 'Baking', icon: '🧁', color: 'bg-rose-300', description: 'Pastries and cakes.' },
  { id: 'wine_tasting', name: 'Wine Tasting', icon: '🍷', color: 'bg-red-900', description: 'Vineyards and flavors.' },
  { id: 'coffee_culture', name: 'Coffee Culture', icon: '☕', color: 'bg-amber-900', description: 'Beans and brewing.' },
  { id: 'tea_ceremony', name: 'Tea Ceremony', icon: '🍵', color: 'bg-green-800', description: 'Matcha and rituals.' },
  { id: 'street_food', name: 'Street Food', icon: '🌮', color: 'bg-orange-500', description: 'Local quick bites.' },
  { id: 'fine_dining', name: 'Fine Dining', icon: '🍽️', color: 'bg-slate-800', description: 'Luxury meals.' },
  { id: 'mixology', name: 'Mixology', icon: '🍹', color: 'bg-purple-400', description: 'Cocktails and drinks.' },
  { id: 'esports', name: 'Esports', icon: '🎮', color: 'bg-violet-600', description: 'Competitive gaming.' },
  { id: 'cosplay', name: 'Cosplay', icon: '🦹', color: 'bg-fuchsia-500', description: 'Costume play.' },
  { id: 'vlogging', name: 'Vlogging', icon: '📹', color: 'bg-red-500', description: 'Video blogging.' },
  { id: 'influencing', name: 'Influencing', icon: '🤳', color: 'bg-pink-500', description: 'Social media fame.' },
  { id: 'digital_nomad', name: 'Digital Nomad', icon: '🌍', color: 'bg-teal-500', description: 'Working while traveling.' },
  { id: 'public_transport', name: 'Public Transport', icon: '🚇', color: 'bg-blue-600', description: 'Trains, buses, and tickets.' },
  { id: 'hotels', name: 'Hotels', icon: '🏨', color: 'bg-indigo-500', description: 'Checking in and room service.' },
  { id: 'airports', name: 'Airports', icon: '🛫', color: 'bg-sky-500', description: 'Flights, luggage, and gates.' },
  { id: 'post_office', name: 'Post Office', icon: '📮', color: 'bg-red-500', description: 'Sending mail and packages.' },
  { id: 'library', name: 'Library', icon: '🤫', color: 'bg-amber-600', description: 'Books and quiet study.' },
  { id: 'city_life', name: 'City Life', icon: '🏙️', color: 'bg-gray-600', description: 'Urban living and bustle.' },
  { id: 'construction', name: 'Construction', icon: '🚧', color: 'bg-yellow-500', description: 'Building sites and tools.' },
  { id: 'police', name: 'Police', icon: '🚓', color: 'bg-blue-800', description: 'Law enforcement terms.' },
  { id: 'fire_safety', name: 'Fire Safety', icon: '🧯', color: 'bg-red-600', description: 'Emergencies and prevention.' },
  { id: 'hair_salon', name: 'Hair Salon', icon: '💇', color: 'bg-pink-400', description: 'Haircuts and styling.' },
  { id: 'supermarket', name: 'Supermarket', icon: '🛒', color: 'bg-green-500', description: 'Grocery shopping.' },
  { id: 'museum', name: 'Museum', icon: '🏛️', color: 'bg-stone-500', description: 'Exhibits and history.' },
  { id: 'park', name: 'Park', icon: '⛲', color: 'bg-emerald-500', description: 'Recreation and nature.' },
  { id: 'stadium', name: 'Stadium', icon: '🏟️', color: 'bg-blue-600', description: 'Sports events and crowds.' },
  { id: 'circus', name: 'Circus', icon: '🎪', color: 'bg-red-500', description: 'Performers and acts.' },
  { id: 'casino', name: 'Casino', icon: '🎰', color: 'bg-purple-600', description: 'Gambling and games.' },
  { id: 'picnic', name: 'Picnic', icon: '🧺', color: 'bg-lime-500', description: 'Outdoor dining.' },
  { id: 'pregnancy', name: 'Pregnancy', icon: '🤰', color: 'bg-rose-300', description: 'Expecting a baby.' },
  { id: 'divorce', name: 'Divorce', icon: '💔', color: 'bg-gray-400', description: 'Separation and legalities.' },
  { id: 'funeral', name: 'Funeral', icon: '⚱️', color: 'bg-stone-700', description: 'Mourning and rites.' },
  { id: 'religion', name: 'Religion', icon: '🛐', color: 'bg-violet-500', description: 'Faith and worship.' },
  { id: 'spirituality', name: 'Spirituality', icon: '🕉️', color: 'bg-indigo-300', description: 'Inner peace and soul.' },
  { id: 'superstitions', name: 'Superstitions', icon: '🤞', color: 'bg-purple-400', description: 'Luck and beliefs.' },
  { id: 'tarot', name: 'Tarot', icon: '🃏', color: 'bg-fuchsia-600', description: 'Cards and fortune.' },
  { id: 'ghosts', name: 'Ghosts', icon: '👻', color: 'bg-gray-200', description: 'Spirits and haunting.' },
  { id: 'time_travel', name: 'Time Travel', icon: '⏳', color: 'bg-cyan-600', description: 'Past and future.' },
  { id: 'superheroes', name: 'Superheroes', icon: '🦸', color: 'bg-red-600', description: 'Powers and saving the world.' },
  { id: 'villains', name: 'Villains', icon: '🦹', color: 'bg-green-800', description: 'Antagonists and plots.' },
  { id: 'monsters', name: 'Monsters', icon: '👹', color: 'bg-red-800', description: 'Creatures and beasts.' },
  { id: 'fables', name: 'Fables', icon: '📖', color: 'bg-amber-400', description: 'Moral stories.' },
  { id: 'folklore', name: 'Folklore', icon: '🧚', color: 'bg-emerald-400', description: 'Traditional tales.' },
  { id: 'spies', name: 'Spies', icon: '🕶️', color: 'bg-zinc-800', description: 'Espionage and secrets.' },
  { id: 'pirates', name: 'Pirates', icon: '🏴‍☠️', color: 'bg-stone-800', description: 'Sea raiders and treasure.' },
  { id: 'vikings', name: 'Vikings', icon: '🪓', color: 'bg-slate-500', description: 'Norse warriors.' },
  { id: 'cowboys', name: 'Cowboys', icon: '🤠', color: 'bg-orange-700', description: 'Wild west.' },
  { id: 'royalty', name: 'Royalty', icon: '👑', color: 'bg-purple-700', description: 'Kings and queens.' },
  { id: 'revolution', name: 'Revolution', icon: '✊', color: 'bg-red-700', description: 'Change and uprising.' },
  { id: 'war_peace', name: 'War & Peace', icon: '🕊️', color: 'bg-blue-300', description: 'Conflict and harmony.' },
  { id: 'crime', name: 'Crime', icon: '🚓', color: 'bg-slate-700', description: 'Breaking the law.' },
  { id: 'prison', name: 'Prison', icon: '⛓️', color: 'bg-gray-600', description: 'Incarceration.' },
  { id: 'wealth', name: 'Wealth', icon: '💰', color: 'bg-green-400', description: 'Riches and luxury.' },
  { id: 'immigration', name: 'Immigration', icon: '🛂', color: 'bg-blue-500', description: 'Moving countries.' },
  { id: 'lgbtq', name: 'LGBTQ+', icon: '🏳️‍🌈', color: 'bg-pink-500', description: 'Pride and identity.' },
  { id: 'disability', name: 'Disability', icon: '♿', color: 'bg-blue-400', description: 'Accessibility and rights.' },
  { id: 'adoption', name: 'Adoption', icon: '🤲', color: 'bg-teal-400', description: 'New families.' },
  { id: 'ancestry', name: 'Ancestry', icon: '🌳', color: 'bg-green-700', description: 'Roots and lineage.' },
  { id: 'culture_shock', name: 'Culture Shock', icon: '😲', color: 'bg-orange-400', description: 'Adapting to new places.' },
  { id: 'slang', name: 'Slang', icon: '💬', color: 'bg-yellow-400', description: 'Casual language.' },
  { id: 'idioms', name: 'Idioms', icon: '🐸', color: 'bg-green-300', description: 'Phrases and meanings.' },
  { id: 'proverbs', name: 'Proverbs', icon: '📜', color: 'bg-amber-200', description: 'Wise sayings.' },
  { id: 'dating_apps', name: 'Dating Apps', icon: '📱', color: 'bg-pink-500', description: 'Swiping and profiles.' },
  { id: 'breakups', name: 'Breakups', icon: '💔', color: 'bg-gray-500', description: 'Moving on and heartache.' },
  { id: 'roommates', name: 'Roommates', icon: '🏠', color: 'bg-orange-400', description: 'Chores and rent.' },
  { id: 'freelancing', name: 'Freelancing', icon: '💻', color: 'bg-blue-400', description: 'Clients and invoicing.' },
  { id: 'remote_work', name: 'Remote Work', icon: '🏠', color: 'bg-indigo-400', description: 'Zoom and home office.' },
  { id: 'job_interviews', name: 'Interviews', icon: '👔', color: 'bg-slate-600', description: 'Resumes and questions.' },
  { id: 'university_life', name: 'Uni Life', icon: '🎓', color: 'bg-yellow-600', description: 'Dorms and lectures.' },
  { id: 'study_abroad', name: 'Study Abroad', icon: '🌏', color: 'bg-green-500', description: 'Exchange and adventure.' },
  { id: 'hostels', name: 'Hostels', icon: '🛏️', color: 'bg-orange-500', description: 'Bunks and community.' },
  { id: 'backpacking', name: 'Backpacking', icon: '🎒', color: 'bg-emerald-600', description: 'Travel on a budget.' },
  { id: 'road_trips', name: 'Road Trips', icon: '🛣️', color: 'bg-amber-600', description: 'Highways and snacks.' },
  { id: 'van_life', name: 'Van Life', icon: '🚐', color: 'bg-teal-500', description: 'Nomadic living.' },
  { id: 'tiny_homes', name: 'Tiny Homes', icon: '🏘️', color: 'bg-lime-500', description: 'Downsizing and efficiency.' },
  { id: 'smart_home', name: 'Smart Home', icon: '💡', color: 'bg-blue-500', description: 'Automation and voice.' },
  { id: 'drones', name: 'Drones', icon: '🚁', color: 'bg-sky-500', description: 'Flying and aerial shots.' },
  { id: 'virtual_reality', name: 'VR', icon: '🥽', color: 'bg-purple-600', description: 'Headsets and immersion.' },
  { id: 'blockchain', name: 'Blockchain', icon: '⛓️', color: 'bg-slate-500', description: 'Decentralized ledgers.' },
  { id: 'biohacking', name: 'Biohacking', icon: '🧬', color: 'bg-rose-500', description: 'Optimization and implants.' },
  { id: 'space_tourism', name: 'Space Tourism', icon: '🚀', color: 'bg-indigo-800', description: 'Orbit and zero-g.' },
  { id: 'aliens', name: 'Aliens', icon: '👽', color: 'bg-green-600', description: 'UFOs and contact.' },
  { id: 'conspiracy', name: 'Conspiracies', icon: '👁️', color: 'bg-stone-600', description: 'Secrets and theories.' },
  { id: 'urban_legends', name: 'Urban Legends', icon: '👹', color: 'bg-red-700', description: 'Myths and cryptids.' },
  { id: 'true_crime', name: 'True Crime', icon: '🕵️‍♀️', color: 'bg-gray-800', description: 'Detectives and cases.' },
  { id: 'survivalism', name: 'Survivalism', icon: '🔥', color: 'bg-orange-800', description: 'Prepping and skills.' },
  { id: 'foraging', name: 'Foraging', icon: '🍄', color: 'bg-green-700', description: 'Finding wild food.' },
  { id: 'fishing', name: 'Fishing', icon: '🎣', color: 'bg-blue-600', description: 'Lures and catch.' },
  { id: 'sailing', name: 'Sailing', icon: '⛵', color: 'bg-cyan-500', description: 'Knots and wind.' },
  { id: 'scuba', name: 'Scuba Diving', icon: '🤿', color: 'bg-blue-800', description: 'Underwater exploration.' },
  { id: 'rock_climbing', name: 'Climbing', icon: '🧗', color: 'bg-stone-500', description: 'Belay and harness.' },
  { id: 'parkour', name: 'Parkour', icon: '🏃‍♂️', color: 'bg-yellow-500', description: 'Jumps and flips.' },
  { id: 'graffiti', name: 'Graffiti', icon: '🎨', color: 'bg-pink-600', description: 'Street art and spray.' },
  { id: 'tattoos', name: 'Tattoos', icon: '🖊️', color: 'bg-zinc-700', description: 'Ink and needles.' },
  { id: 'festivals', name: 'Festivals', icon: '🎡', color: 'bg-purple-500', description: 'Music and crowds.' },
  { id: 'karaoke', name: 'Karaoke', icon: '🎤', color: 'bg-fuchsia-500', description: 'Singing and lyrics.' },
  { id: 'escape_rooms', name: 'Escape Rooms', icon: '🔐', color: 'bg-slate-700', description: 'Puzzles and locks.' },
  { id: 'bowling', name: 'Bowling', icon: '🎳', color: 'bg-blue-400', description: 'Strikes and spares.' },
  { id: 'billiards', name: 'Billiards', icon: '🎱', color: 'bg-green-800', description: 'Pool and cues.' },
  { id: 'sudoku', name: 'Sudoku', icon: '🔢', color: 'bg-gray-400', description: 'Number grids.' },
  { id: 'upcycling', name: 'Upcycling', icon: '♻️', color: 'bg-emerald-500', description: 'Creative reuse.' },
  { id: 'thrifting', name: 'Thrifting', icon: '👕', color: 'bg-orange-300', description: 'Second-hand finds.' },
  { id: 'antiques', name: 'Antiques', icon: '🕰️', color: 'bg-amber-700', description: 'Vintage items.' },
  { id: 'auctions', name: 'Auctions', icon: '🔨', color: 'bg-stone-400', description: 'Bidding and gavels.' },
  { id: 'flea_markets', name: 'Flea Markets', icon: '🎪', color: 'bg-yellow-400', description: 'Bargains and stalls.' },
  { id: 'bartering', name: 'Bartering', icon: '🤝', color: 'bg-green-400', description: 'Trading goods.' },
  { id: 'crowdfunding', name: 'Crowdfunding', icon: '💸', color: 'bg-lime-600', description: 'Backing projects.' },
  { id: 'startups', name: 'Startups', icon: '🚀', color: 'bg-indigo-600', description: 'Innovation and growth.' },
  { id: 'entrepreneurship', name: 'Founders', icon: '💼', color: 'bg-slate-800', description: 'Building businesses.' },
  { id: 'franchising', name: 'Franchising', icon: '🏪', color: 'bg-orange-600', description: 'Chain stores.' },
  { id: 'consulting', name: 'Consulting', icon: '📊', color: 'bg-blue-700', description: 'Expert advice.' },
  { id: 'diplomacy', name: 'Diplomacy', icon: '🕊️', color: 'bg-sky-600', description: 'Treaties and ambassadors.' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  userState,
  onStartLesson,
  onStartPractice,
  onChangeLanguage,
  onChangeDifficulty,
  onToggleTimer,
  offlineLessons,
  onDownload,
  onDeleteDownload,
  onOpenProfile,
  onOpenShop,
  onResetTopic,
  onReorderTopics,
  downloadingId,
  isOffline,
  onImportLanguage,
  onImportLanguages,
  onImportLessonData
}) => {
  const [focusedTopicIndex, setFocusedTopicIndex] = useState(0);
  const topicRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk Download State
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number} | null>(null);
  const cancelDownloadRef = useRef(false);

  // Context Menu State
  const [resetMenuTopic, setResetMenuTopic] = useState<{id: string, name: string} | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag and Drop State
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);

  // Filtering and Sorting State
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'MASTERED'>('ALL');
  const [sort, setSort] = useState<'DEFAULT' | 'NAME' | 'LEVEL'>('DEFAULT');

  // Compute Base Ordered Topics
  const getOrderedTopics = () => {
      // If no custom order, return default TOPICS
      if (!userState.topicOrder || userState.topicOrder.length === 0) return TOPICS;

      const orderMap = new Map<string, number>();
      userState.topicOrder.forEach((id, index) => orderMap.set(id, index));

      const sorted = [...TOPICS].sort((a, b) => {
          const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
          const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
          return indexA - indexB;
      });
      return sorted;
  };

  const baseTopics = getOrderedTopics();

  // Pre-calculate status for all topics based on the CURRENT ORDER (path order) to preserve unlock logic
  const topicsWithMeta = baseTopics.map((topic, index) => {
     // Unlock logic: First item is unlocked, or if previous topic has at least level 1
     const prevTopic = index > 0 ? baseTopics[index - 1] : null;
     const prevLevelRaw = prevTopic && userState.topicLevels ? userState.topicLevels[prevTopic.id] : undefined;
     const prevLevelVal: number = typeof prevLevelRaw === 'number' ? prevLevelRaw : 0;
     const isPrevCompleted = prevTopic ? userState.completedLessons.includes(prevTopic.id) : false;
     
     const prevLevel = prevTopic 
       ? (prevLevelVal > 0 ? prevLevelVal : (isPrevCompleted ? 1 : 0))
       : 1;
     
     const isUnlocked = index === 0 || prevLevel > 0;
     
     const levelRaw = userState.topicLevels?.[topic.id];
     const level: number = typeof levelRaw === 'number' ? levelRaw : 0;
     const isMastered = level >= 5;

     return { ...topic, isUnlocked, level, isMastered, originalIndex: index };
  });

  // Apply Filter and Sort
  let displayedTopics = [...topicsWithMeta];

  if (searchQuery.trim()) {
    displayedTopics = displayedTopics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }

  if (filter === 'IN_PROGRESS') {
      displayedTopics = displayedTopics.filter(t => t.level > 0 && !t.isMastered);
  } else if (filter === 'MASTERED') {
      displayedTopics = displayedTopics.filter(t => t.isMastered);
  }

  if (sort === 'NAME') {
      displayedTopics.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'LEVEL') {
      displayedTopics.sort((a, b) => (b.level - a.level) || (a.originalIndex - b.originalIndex));
  }

  const isDefaultView = filter === 'ALL' && sort === 'DEFAULT' && !searchQuery;

  // On mount, auto-focus the first incomplete lesson (only in default view)
  useEffect(() => {
    if (isDefaultView) {
        const firstUnfinished = baseTopics.findIndex(t => !userState.completedLessons.includes(t.id));
        if (firstUnfinished !== -1) {
            setFocusedTopicIndex(firstUnfinished);
        } else {
            setFocusedTopicIndex(baseTopics.length - 1);
        }
    }
  }, []); // Only on mount

  // Reset focus when list changes
  useEffect(() => {
      setFocusedTopicIndex(0);
  }, [filter, sort, searchQuery]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow moving through lessons with arrows
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.min(prev + 1, displayedTopics.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (showLanguageSelector || showImportHelp || showDownloadConfirm || bulkProgress || showAbout || showSettings || resetMenuTopic) return;
        e.preventDefault();
        const topic = displayedTopics[focusedTopicIndex];
        if (topic) {
          onStartLesson(topic.id, topic.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedTopicIndex, onStartLesson, displayedTopics, showLanguageSelector, showImportHelp, showDownloadConfirm, bulkProgress, showAbout, showSettings, resetMenuTopic]);

  // Auto-scroll to focused topic
  useEffect(() => {
    if (topicRefs.current[focusedTopicIndex]) {
      topicRefs.current[focusedTopicIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [focusedTopicIndex]);

  const allLanguages = [...SUPPORTED_LANGUAGES, ...(userState.customLanguages || [])];
  const currentLangConfig = allLanguages.find(l => l.code === userState.currentLanguage) || SUPPORTED_LANGUAGES[0];
  
  // Helper to check download status
  const getOfflineStatus = (topicId: string) => {
    const lang = userState.currentLanguage;
    const diff = userState.difficulty;
    const key = `${topicId}-${diff}`;
    
    if (offlineLessons[lang] && offlineLessons[lang][key]) return 'DOWNLOADED';
    return 'NONE';
  };

  const getUndownloadedTopics = () => {
    return TOPICS.filter(t => getOfflineStatus(t.id) === 'NONE');
  };

  const handleDownloadAllClick = () => {
    const toDownload = getUndownloadedTopics();
    if (toDownload.length === 0) {
        alert("All topics for this level are already downloaded!");
        return;
    }
    setShowDownloadConfirm(true);
  };

  const confirmBulkDownload = async () => {
    setShowDownloadConfirm(false);
    const toDownload = getUndownloadedTopics();
    setBulkProgress({ current: 0, total: toDownload.length });
    cancelDownloadRef.current = false; // Reset cancel flag

    for (let i = 0; i < toDownload.length; i++) {
        if (cancelDownloadRef.current) {
            break; // Stop if cancelled
        }

        const topic = toDownload[i];
        try {
            await onDownload(topic.id, topic.name);
        } catch (e) {
            console.error(`Failed to download ${topic.name}`, e);
        }

        // Check again before updating state to prevent race conditions or zombie modals
        if (!cancelDownloadRef.current) {
            setBulkProgress({ current: i + 1, total: toDownload.length });
        }
        
        // Small delay to prevent complete UI lockup and give time for state updates
        await new Promise(r => setTimeout(r, 50));
    }

    setBulkProgress(null);
  };

  const handleCancelBulkDownload = () => {
      cancelDownloadRef.current = true;
      setBulkProgress(null);
  };

  const handleContextMenu = (e: React.MouseEvent, topic: {id: string, name: string}) => {
    e.preventDefault();
    setResetMenuTopic(topic);
  };

  const startLongPress = (topic: {id: string, name: string}) => {
    longPressTimer.current = setTimeout(() => {
      setResetMenuTopic(topic);
    }, 800); // 800ms for long press
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleResetConfirm = () => {
    if (resetMenuTopic) {
        onResetTopic(resetMenuTopic.id);
        setResetMenuTopic(null);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, topicId: string) => {
    if (!isDefaultView) {
        e.preventDefault();
        return;
    }
    setDraggedTopicId(topicId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', topicId);
  };

  const handleDragOver = (e: React.DragEvent, targetTopicId: string) => {
    if (!isDefaultView) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTopicId: string) => {
    if (!isDefaultView) return;
    e.preventDefault();
    
    const sourceId = draggedTopicId;
    if (!sourceId || sourceId === targetTopicId) {
        setDraggedTopicId(null);
        return;
    }

    // Reorder logic
    const currentOrder = baseTopics.map(t => t.id);
    const sourceIndex = currentOrder.indexOf(sourceId);
    const targetIndex = currentOrder.indexOf(targetTopicId);

    if (sourceIndex > -1 && targetIndex > -1) {
        const newOrder = [...currentOrder];
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceId);
        onReorderTopics(newOrder);
    }
    
    setDraggedTopicId(null);
  };


  const totalCrowns = (Object.values(userState.topicLevels || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const maxCrowns = TOPICS.length * 5;
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            // Basic validation
            if (json.code && json.name && json.flag) {
                // Check for duplicates
                const exists = allLanguages.some(l => l.code === json.code);
                if (exists) {
                    alert("Language already exists!");
                    return;
                }
                onImportLanguage(json);
                setShowLanguageSelector(false);
            } else {
                alert("Invalid JSON format. Required: code, name, flag");
            }
        } catch (err) {
            alert("Error parsing JSON file");
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<LanguageConfig | null>[] = Array.from(files).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    // Basic validation
                    if (json.code && json.name && json.flag) {
                        resolve(json);
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            };
            reader.readAsText(file);
        });
    });

    Promise.all(readers).then(results => {
        const validLangs = results.filter((l): l is LanguageConfig => l !== null);
        
        // Filter out duplicates that already exist in the app
        const newLangs = validLangs.filter(l => !allLanguages.some(existing => existing.code === l.code));
        
        // Filter out duplicates within the uploaded batch (keep first occurrence)
        const uniqueNewLangs = newLangs.filter((l, index, self) => 
            index === self.findIndex((t) => t.code === l.code)
        );

        if (uniqueNewLangs.length > 0) {
            if (onImportLanguages) {
                onImportLanguages(uniqueNewLangs);
                setShowLanguageSelector(false);
            } else {
                // Fallback for safety
                uniqueNewLangs.forEach(l => onImportLanguage(l));
                setShowLanguageSelector(false);
            }
        } else {
            if (validLangs.length > 0) {
                alert("All selected languages already exist!");
            } else {
                alert("No valid language configuration files found.");
            }
        }
    });
    
    event.target.value = '';
  };

  const handleExportLessons = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offlineLessons, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gemolingo_lessons.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportLessonsFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              onImportLessonData(json);
              setShowSettings(false);
          } catch (err) {
              alert("Error parsing JSON file");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           {/* Language Selector Trigger */}
           <button 
             onClick={() => setShowLanguageSelector(true)}
             className="flex items-center gap-1 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-95 border-2 border-transparent hover:border-gray-200"
             title="Select Language"
           >
             <span className="text-2xl">{currentLangConfig?.flag}</span>
           </button>

           {/* Difficulty Selector */}
           <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors group relative border-2 border-transparent hover:border-gray-200">
             <Signal size={16} className={`
                ${userState.difficulty === 'beginner' ? 'text-green-500' : ''}
                ${userState.difficulty === 'intermediate' ? 'text-yellow-500' : ''}
                ${userState.difficulty === 'advanced' ? 'text-red-500' : ''}
             `} />
             <span className="font-bold text-xs text-gray-600 capitalize hidden min-[360px]:block">{userState.difficulty}</span>
             <ChevronDown size={14} className="text-gray-400" />
             
             {/* Dropdown */}
             <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 hidden group-focus-within:block w-40 z-50 animate-pop-in">
                {difficulties.map(diff => (
                  <div 
                    key={diff}
                    onClick={() => onChangeDifficulty(diff)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 
                      ${userState.difficulty === diff ? 'bg-blue-50 text-duo-blue' : 'text-gray-600'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      diff === 'beginner' ? 'bg-green-400' : 
                      diff === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className="capitalize font-bold text-sm">{diff}</span>
                    {userState.difficulty === diff && <Check size={14} className="ml-auto"/>}
                  </div>
                ))}
             </div>
           </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleTimer}
            className={`
              flex items-center gap-1 px-2 py-1.5 rounded-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 focus:outline-none
              ${userState.timerEnabled 
                ? 'bg-yellow-400 border-yellow-600 text-yellow-900 shadow-lg' 
                : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
              }
            `}
            title={userState.timerEnabled ? "Speed Run Active" : "Enable Speed Run"}
          >
            <Zap size={16} className={userState.timerEnabled ? "fill-current animate-pulse" : ""} />
            <span className="font-extrabold text-[10px] tracking-wide hidden min-[400px]:block">SPEED</span>
          </button>

          <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
            <Flame className="fill-current" size={18} /> {userState.streak}
          </div>
          <div className="flex items-center gap-1 text-duo-yellow-dark font-bold text-sm">
            <Zap className="fill-current" size={18} /> {userState.xp}
          </div>
        </div>
      </div>

      {/* Filter/Sort Bar */}
      <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
         {/* Search Input */}
         <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100 min-w-[140px]">
             <Search size={14} className="text-gray-400" />
             <input 
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search..."
               className="text-xs font-bold text-gray-600 bg-transparent outline-none w-full placeholder-gray-300"
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                 <X size={12} />
               </button>
             )}
         </div>

         <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
             <Filter size={14} className="text-gray-400" />
             <select 
               value={filter}
               onChange={(e) => setFilter(e.target.value as any)}
               className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
             >
                <option value="ALL">All Topics</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="MASTERED">Mastered</option>
             </select>
         </div>

         <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
             <ArrowUpDown size={14} className="text-gray-400" />
             <select 
               value={sort}
               onChange={(e) => setSort(e.target.value as any)}
               className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
             >
                <option value="DEFAULT">Path Order</option>
                <option value="NAME">Name (A-Z)</option>
                <option value="LEVEL">Level (High-Low)</option>
             </select>
         </div>
         
         <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-wider">
             {displayedTopics.length} Topics
         </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {isDefaultView && (
            <div className="space-y-4">

            {/* Quick Practice Button */}
            {!isOffline && (
              <button
                onClick={onStartPractice}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-purple-200 transform transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
              >
                <div className="flex items-center gap-4 relative z-10">
                   <div className="bg-white/20 p-3 rounded-xl border border-white/20">
                      <Dumbbell size={24} className="text-white" />
                   </div>
                   <div className="text-left">
                      <div className="font-bold text-lg">Quick Practice</div>
                      <div className="text-xs text-purple-100 font-bold opacity-90">Review your weak spots</div>
                   </div>
                </div>
                <div className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
                   START
                </div>
                {/* Decoration */}
                <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              </button>
            )}
            
            {/* Download All Button */}
            {!isOffline && (
              <button
                onClick={handleDownloadAllClick}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-duo-blue p-4 rounded-2xl flex items-center justify-between transition-colors group relative overflow-hidden"
              >
                <div className="flex items-center gap-4 relative z-10">
                   <div className="bg-white p-3 rounded-xl border-2 border-blue-100 group-hover:scale-110 transition-transform">
                      <CloudDownload size={24} className="text-duo-blue" />
                   </div>
                   <div className="text-left">
                      <div className="font-bold text-lg text-gray-800">Offline Course</div>
                      <div className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1">
                         {getUndownloadedTopics().length} Lessons Available
                      </div>
                   </div>
                </div>
                <div className="bg-duo-blue text-white px-4 py-2 rounded-xl font-bold shadow-sm border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 relative z-10 text-sm">
                   GET ALL
                </div>
                {/* Decoration */}
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-100 to-transparent opacity-50"></div>
              </button>
            )}

            {/* Daily Goal */}
            <DailyGoalWidget dailyXp={userState.dailyXp} dailyGoal={userState.dailyGoal} />

            {/* Course Progress Widget */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-2 z-10 relative">
                    <span className="font-bold text-yellow-100 uppercase text-xs tracking-wider">Course Mastery</span>
                    <span className="font-bold">{Math.round((totalCrowns / maxCrowns) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden z-10 relative">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(totalCrowns / maxCrowns) * 100}%` }} />
                </div>
                <Crown className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12" />
            </div>
            </div>
        )}

        <div className={`flex flex-col items-center gap-8 relative py-4 ${!isDefaultView ? 'gap-4' : ''}`}>
           {/* Path Guide Line (Simplified) - Only in default view */}
           {isDefaultView && (
               <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-gray-200 -translate-x-1/2 rounded-full -z-10" />
           )}
           
           {displayedTopics.length === 0 && (
               <div className="text-center text-gray-400 py-10">
                   <div className="mb-2 text-4xl">🏜️</div>
                   <div>No topics found for this filter.</div>
               </div>
           )}

           {displayedTopics.map((topic, index) => {
             // For default view, use the original index to maintain the zigzag path correctly
             // For other views, we reset the zigzag logic to a simple list/grid
             const i = isDefaultView ? topic.originalIndex : index;
             const isUnlocked = topic.isUnlocked;
             const level = topic.level;
             const isMastered = topic.isMastered;
             const isDragging = draggedTopicId === topic.id;

             // Zigzag pattern calculation
             const offset = isDefaultView 
                ? ((i % 2) === 0 ? 'translate-x-0' : ((i % 4) === 1 ? '-translate-x-8' : 'translate-x-8'))
                : 'translate-x-0'; // Center align in filtered view
             
             const isFocused = focusedTopicIndex === index;
             const offlineStatus = getOfflineStatus(topic.id);
             const isDownloading = downloadingId === topic.id;

             // Progress Calculation for Ring
             const progressPercent = Math.min(100, (level / 5) * 100);
             const radius = 42;
             const circumference = 2 * Math.PI * radius;
             const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

             return (
               <div 
                  key={topic.id} 
                  className={`relative group ${offset} transition-transform duration-300 ${isDragging ? 'opacity-50 scale-95' : ''}`}
                  draggable={isDefaultView}
                  onDragStart={(e) => handleDragStart(e, topic.id)}
                  onDragOver={(e) => handleDragOver(e, topic.id)}
                  onDrop={(e) => handleDrop(e, topic.id)}
               >
                 {/* Tooltip */}
                 <div className="absolute bottom-[110%] mb-2 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-gray-800 text-white text-xs p-3 rounded-xl shadow-xl text-center relative border border-gray-700">
                        <p className="font-bold mb-1 text-sm text-yellow-400">{topic.name}</p>
                        <p className="text-gray-300 leading-tight">{topic.description}</p>
                        {/* Triangle */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-800"></div>
                    </div>
                 </div>

                 {/* Progress Ring Wrapper */}
                 <div className="relative flex items-center justify-center">
                    {/* Drag Handle (Visible only on hover in default view) */}
                    {isDefaultView && (
                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-move transition-opacity p-2">
                             <GripVertical size={20} />
                        </div>
                    )}

                    {/* Background Ring */}
                    {isUnlocked && (
                      <svg className="absolute w-24 h-24 -rotate-90 pointer-events-none" style={{ zIndex: 5 }}>
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={isMastered ? "#fbbf24" : "#e5e7eb"} 
                          strokeWidth="6"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={isMastered ? "#f59e0b" : "#fbbf24"} // Gold or yellow
                          strokeWidth="6"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                    )}

                    {/* Lesson Node Button */}
                    <button
                      ref={el => { topicRefs.current[index] = el; }}
                      onClick={() => onStartLesson(topic.id, topic.name)}
                      onContextMenu={(e) => handleContextMenu(e, topic)}
                      onTouchStart={() => startLongPress(topic)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-all relative z-10
                        border-b-8 active:border-b-0 active:translate-y-2 focus:outline-none select-none
                        ${isMastered 
                            ? 'bg-amber-400 border-amber-600 text-white shadow-amber-200'
                            : (isUnlocked 
                                ? `${topic.color} border-black/20 text-white`
                                : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed')
                        }
                        ${isFocused ? 'ring-4 ring-offset-2 ring-duo-blue scale-110' : ''}
                      `}
                      disabled={!isUnlocked}
                    >
                      {isMastered ? <Crown size={32} className="text-white drop-shadow-md fill-current" strokeWidth={2} /> : topic.icon}
                    </button>

                    {/* Speed Run Indicator on Node */}
                    {isUnlocked && userState.timerEnabled && (
                        <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5 border-2 border-white shadow-md z-20 animate-bounce">
                           <Zap size={14} fill="currentColor" />
                        </div>
                    )}
                    
                    {/* Crown Level Badge */}
                    {isUnlocked && level > 0 && (
                        <div className={`
                           absolute -top-1 -right-4 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full border-2 shadow-sm text-xs font-bold
                           ${isMastered ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-yellow-500 border-gray-100'}
                        `}>
                           <Crown size={10} className="fill-current" />
                           {level}
                        </div>
                    )}
                 </div>

                 {/* Label */}
                 <div className="text-center font-bold text-gray-600 mt-2 text-sm bg-white/80 px-2 rounded-lg backdrop-blur-sm">
                   {topic.name}
                 </div>

                 {/* Download/Offline Controls */}
                 {!isOffline && (
                    <div className="absolute top-0 -right-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      {offlineStatus === 'DOWNLOADED' ? (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteDownload(topic.id); }}
                           className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow border border-gray-200"
                           title="Remove download"
                         >
                           <Trash2 size={14} />
                         </button>
                      ) : (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDownload(topic.id, topic.name); }}
                           className="p-2 bg-white rounded-full text-duo-blue hover:bg-blue-50 shadow border border-gray-200"
                           title="Download for offline"
                           disabled={isDownloading}
                         >
                           {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                         </button>
                      )}
                    </div>
                 )}
                 {offlineStatus === 'DOWNLOADED' && (
                     <div className="absolute top-0 -left-8 text-duo-blue bg-white rounded-full p-1 border shadow-sm" title="Available Offline">
                        <Check size={12} strokeWidth={3} />
                     </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="border-t-2 border-gray-200 p-2 flex justify-around bg-white">
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenShop}>
          <Store size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={() => setShowSettings(true)}>
          <Settings size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={() => setShowAbout(true)}>
          <Info size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenProfile}>
          <Trophy size={28} />
        </button>
      </div>

      {/* Reset Menu Modal */}
      {resetMenuTopic && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <div className="flex items-center gap-3 mb-4 text-gray-800">
                   <div className="bg-gray-100 p-3 rounded-full text-gray-600">
                      <RefreshCw size={24} />
                   </div>
                   <h3 className="text-xl font-bold">Manage Topic</h3>
                </div>
                
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{TOPICS.find(t => t.id === resetMenuTopic.id)?.icon}</div>
                    <div className="font-bold text-lg text-gray-800">{resetMenuTopic.name}</div>
                    <div className="text-sm text-gray-500">Current Level: {userState.topicLevels?.[resetMenuTopic.id] || 0}</div>
                </div>

                <div className="space-y-3">
                   <Button 
                     variant="danger" 
                     fullWidth 
                     onClick={handleResetConfirm}
                     className="flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={16} /> Reset Progress
                   </Button>
                   <Button 
                     variant="ghost" 
                     fullWidth 
                     onClick={() => setResetMenuTopic(null)}
                   >
                     Cancel
                   </Button>
                </div>
                <div className="text-xs text-center text-gray-400 mt-4">
                    This will reset your level for this topic to 0.
                </div>
             </div>
          </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
              <button 
                onClick={() => setShowAbout(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-duo-green">
                 <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Info size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-800">About Gemolingo</h3>
              </div>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                 <p>
                    <strong>Gemolingo</strong> is a next-generation language learning app powered by Google's Gemini API.
                 </p>
                 
                 <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">Key Features:</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                       <li><strong>AI-Generated Lessons:</strong> Infinite, unique content for every topic.</li>
                       <li><strong>Smart Pronunciation:</strong> Text-to-speech powered by advanced AI models.</li>
                       <li><strong>Offline Mode:</strong> Download topics to learn anywhere.</li>
                       <li><strong>Gamification:</strong> Earn XP, maintain streaks, and climb the leaderboard.</li>
                    </ul>
                 </div>

                 <p className="text-sm">
                    Our mission is to make language learning accessible, personalized, and fun using the latest advancements in Artificial Intelligence.
                 </p>
                 
                 <div className="text-center pt-4">
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered By</div>
                     <div className="font-black text-gray-300 text-xl mt-1">Google Gemini</div>
                 </div>
              </div>

              <div className="mt-8">
                <Button fullWidth onClick={() => setShowAbout(false)}>
                    Close
                </Button>
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => setShowSettings(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-gray-700">
                 <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Settings size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-800">Data Settings</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Download size={18} /> Export Lessons
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                        Download all offline lesson data as a JSON file. Useful for backups.
                    </p>
                    <Button fullWidth variant="secondary" onClick={handleExportLessons}>
                        Export Data
                    </Button>
                 </div>

                 <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100">
                    <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                        <Upload size={18} /> Import Lessons
                    </h4>
                    <p className="text-sm text-green-700 mb-4">
                        Restore lesson data from a JSON file. This will merge with your existing data.
                    </p>
                    <label className="w-full">
                        <div className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl text-center border-b-4 border-green-700 active:border-b-0 active:translate-y-1 cursor-pointer transition-all">
                            Import Data
                        </div>
                        <input type="file" accept=".json" className="hidden" onChange={handleImportLessonsFile} />
                    </label>
                 </div>
              </div>

              <div className="mt-8">
                <Button fullWidth variant="ghost" onClick={() => setShowSettings(false)}>
                    Close
                </Button>
              </div>
           </div>
        </div>
      )}

      {/* Bulk Download Confirmation Modal */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
               <div className="flex items-center gap-3 mb-4 text-gray-800">
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                     <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Download All?</h3>
               </div>
               
               <p className="text-gray-600 mb-2 leading-relaxed">
                  You are about to download <strong>{getUndownloadedTopics().length}</strong> lessons for <strong>{userState.difficulty}</strong> level.
               </p>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">
                  This may take a few minutes.
               </p>

               <div className="flex gap-4">
                   <Button 
                     variant="ghost" 
                     fullWidth 
                     onClick={() => setShowDownloadConfirm(false)}
                   >
                     Cancel
                   </Button>
                   <Button 
                     variant="primary" 
                     fullWidth 
                     onClick={confirmBulkDownload}
                   >
                     Start Download
                   </Button>
               </div>
           </div>
        </div>
      )}

      {/* Bulk Download Progress Modal */}
      {bulkProgress && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-pop-in">
             <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative">
                 <button 
                    onClick={handleCancelBulkDownload}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                 >
                    <X size={24} />
                 </button>
                 <div className="mb-6 flex justify-center">
                    <Loader2 size={48} className="text-duo-blue animate-spin" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-800 mb-2">Downloading...</h3>
                 <p className="text-gray-500 mb-6">
                    Please keep the app open.
                 </p>
                 
                 <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                    <div 
                      className="bg-duo-blue h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                 </div>
                 <div className="text-sm font-bold text-gray-400">
                    {bulkProgress.current} / {bulkProgress.total} Lessons
                 </div>
             </div>
         </div>
      )}

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Globe size={20} className="text-duo-blue" />
                Select Language
              </h3>
              <button 
                onClick={() => {
                  setShowLanguageSelector(false);
                  setLanguageSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-50">
               <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search languages..." 
                   value={languageSearchQuery}
                   onChange={(e) => setLanguageSearchQuery(e.target.value)}
                   className="w-full bg-gray-100 rounded-xl py-2 pl-9 pr-4 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-gray-200"
                   autoFocus
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">All Languages</div>
              {allLanguages
                .filter(lang => 
                  lang.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) || 
                  lang.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
                )
                .map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChangeLanguage(lang.code);
                    setShowLanguageSelector(false);
                    setLanguageSearchQuery('');
                  }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                    ${userState.currentLanguage === lang.code 
                      ? 'border-duo-blue bg-blue-50 text-duo-blue' 
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-4xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-lg">{lang.name}</div>
                    {userState.currentLanguage === lang.code && <div className="text-xs font-bold uppercase">Active</div>}
                  </div>
                  {userState.currentLanguage === lang.code && <Check size={24} strokeWidth={3} />}
                </button>
              ))}
              
              {allLanguages.filter(lang => 
                  lang.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) || 
                  lang.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-400 font-bold">
                      No languages found
                  </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500">
                    <FileJson size={20} />
                    <span className="text-sm font-bold">Custom Language</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                         onClick={() => setShowImportHelp(true)}
                         className="p-2 text-gray-400 hover:text-duo-blue hover:bg-blue-50 rounded-lg transition-colors"
                         title="Help"
                    >
                        <HelpCircle size={20} />
                    </button>
                    
                    {/* New Import All Button */}
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-100 hover:border-duo-blue text-duo-blue rounded-xl cursor-pointer font-bold text-sm transition-colors">
                        <Files size={16} />
                        Import All
                        <input type="file" accept=".json" multiple className="hidden" onChange={handleBulkFileUpload} />
                    </label>

                    <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 hover:border-duo-blue text-duo-blue rounded-xl cursor-pointer font-bold text-sm transition-colors">
                        <Upload size={16} />
                        Import
                        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                    </label>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Help Modal */}
      {showImportHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => setShowImportHelp(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-4 text-duo-blue">
                 <FileJson size={32} />
                 <h3 className="text-xl font-bold text-gray-800">Import Language</h3>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                 Add custom languages by importing a JSON file with the following format:
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm border-2 border-gray-100 mb-6 relative group">
                 <div className="text-gray-400 mb-2 text-[10px] font-bold uppercase tracking-wider select-none flex justify-between">
                    <span>example.json</span>
                 </div>
                 <pre className="text-gray-700 whitespace-pre-wrap break-all">
{`{
  "code": "fr",
  "name": "French",
  "flag": "🇫🇷"
}`}
                 </pre>
              </div>

              <Button fullWidth onClick={() => setShowImportHelp(false)}>
                 Got it
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};