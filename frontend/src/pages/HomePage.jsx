import { BookOpen, Users, Video, Settings } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import StatCard from '../components/StatCard';

const HomePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-heading mb-4">
          Welcome to I75 Educational Platform
        </h1>
        <p className="text-xl text-text max-w-3xl mx-auto">
          Your comprehensive learning management system for courses, instructors, and educational content.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <FeatureCard
          icon={<BookOpen className="w-8 h-8" />}
          title="Courses"
          description="Browse and manage educational courses"
          link="/courses"
        />
        <FeatureCard
          icon={<Users className="w-8 h-8" />}
          title="Instructors"
          description="View instructor profiles and expertise"
          link="/instructors"
        />
        <FeatureCard
          icon={<Video className="w-8 h-8" />}
          title="Videos"
          description="Access video content and lectures"
          link="/videos"
        />
        <FeatureCard
          icon={<Settings className="w-8 h-8" />}
          title="Management"
          description="Administrative tools and settings"
          link="#"
        />
      </div>

      {/* Quick Stats */}
      <div className="bg-bg rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-heading mb-6 text-center">
          Platform Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <StatCard label="Active Courses" value="--" />
          <StatCard label="Instructors" value="--" />
          <StatCard label="Students" value="--" />
          <StatCard label="Video Hours" value="--" />
        </div>
      </div>
    </div>
  );
};

export default HomePage;