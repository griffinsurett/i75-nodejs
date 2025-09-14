import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, link }) => {
  const content = (
    <div className="bg-bg rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-heading mb-2">{title}</h3>
      <p className="text-text">{description}</p>
    </div>
  );

  return link === '#' ? (
    content
  ) : (
    <Link to={link}>
      {content}
    </Link>
  );
};

export default FeatureCard;