const fetchStudentMeetings = async (setMeetings, setMeetingsLoading) => {
  try {
    setMeetingsLoading(true);
    const token = localStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com';
    const response = await fetch(`${apiBase}/api/meetings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setMeetings(data);
    }
  } catch (err) {
    console.error("Student meetings error:", err);
  } finally {
    setMeetingsLoading(false);
  }
};

export default fetchStudentMeetings;
