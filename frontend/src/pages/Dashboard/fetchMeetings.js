const fetchMeetings = async (setMeetings, setLoading) => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/api/meetings/my-meetings", {
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
