export const getStatus = (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is operational',
    timestamp: new Date().toISOString()
  });
};
