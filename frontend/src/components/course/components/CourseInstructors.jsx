import { Users, User } from 'lucide-react';

export default function CourseInstructors({ instructors }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-heading mb-3 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Instructors
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {instructors.map((instructor) => {
          const inst = instructor.instructors || instructor;
          const instImage = instructor.images;
          
          return (
            <div key={inst.instructorId} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-bg2 rounded-full flex items-center justify-center">
                {instImage?.imageUrl ? (
                  <img
                    src={instImage.imageUrl}
                    alt={inst.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-text" />
                )}
              </div>
              <div>
                <div className="font-medium text-heading">{inst.name}</div>
                {inst.bio && (
                  <div className="text-sm text-text truncate">{inst.bio}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}