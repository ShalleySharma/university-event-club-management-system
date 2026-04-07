const fetchMeetings = async (setMeetings, setLoading) => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/meetings/my-meetings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setMeetings(data);
    } else {
      console.error('Error fetching meetings');
    }
  } catch (err) {
    console.error("Error fetching meetings:", err);
  }
  setLoading(false);
};

export default fetchMeetings;
