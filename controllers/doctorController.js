const { db } = require('../config/firebase');

exports.findDoctors = async (req, res) => {
  try {
    const { specialization, city } = req.query;
    let query = db.collection('doctors').where('role', '==', 'doctor').where('isVerified', '==', true);

    if (specialization && specialization !== 'All') {
      query = query.where('specialization', '==', specialization);
    }

    const snapshot = await query.get();
    let doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (city) {
      const key = city.toLowerCase();
      doctors = doctors.filter(doc => 
        (doc.hospitalName && doc.hospitalName.toLowerCase().includes(key)) ||
        (doc.name && doc.name.toLowerCase().includes(key))
      );
    }
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};