import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { potholeAPI } from '../services/api';
import ReportDetailsModern from './ReportDetailsModern';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await potholeAPI.getById(id);
        setReport(response.data.pothole); // <-- Use the pothole object directly
        setError(null);
      } catch (err) {
        setError('Report not found');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading report..." />;
  if (error) return (
    <div className="not-found-page">
      <h2>Report Not Found</h2>
      <p>The report you are looking for does not exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/gallery')}>Back to Gallery</button>
    </div>
  );

  // Render the new modern details page
  return <ReportDetailsModern />;
};

export default ReportDetailsPage; 