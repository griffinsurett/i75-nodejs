// frontend/src/components/instructor/components/InstructorInfoCard.jsx
import DateDisplay from "../../common/DateDisplay";

export default function InstructorInfoCard({
  instructor,
  variant = "details",
  className = "",
}) {
  const instructorData = instructor.instructors || instructor;

  if (variant === "details") {
    return (
      <div className={`bg-bg rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-heading mb-4">Details</h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-text/70">Instructor ID</dt>
            <dd className="text-heading font-mono">
              #{instructorData.instructorId}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text/70">Joined</dt>
            <dd className="text-heading">
              <DateDisplay
                label=""
                date={instructorData.createdAt}
                variant="compact"
                className="text-heading"
              />
            </dd>
          </div>
          {instructorData.updatedAt && (
            <div>
              <dt className="text-sm text-text/70">Last Updated</dt>
              <dd className="text-heading">
                <DateDisplay
                  label=""
                  date={instructorData.updatedAt}
                  variant="compact"
                  className="text-heading"
                />
              </dd>
            </div>
          )}
          {instructorData.email && (
            <div>
              <dt className="text-sm text-text/70">Email</dt>
              <dd className="text-heading">{instructorData.email}</dd>
            </div>
          )}
        </dl>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`p-4 bg-bg2 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text/70">ID</span>
          <span className="font-mono text-sm">
            #{instructorData.instructorId}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text/70">Joined</span>
          <DateDisplay
            label=""
            date={instructorData.createdAt}
            variant="compact"
            className="text-sm"
          />
        </div>
      </div>
    );
  }

  return null;
}