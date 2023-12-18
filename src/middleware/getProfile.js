const getProfile = async (req, res, next) => {
  const { Profile } = req.app.get('models')
  const profileId = req.get('profile_id')
  if (!profileId) return res.status(401).end()
  const profile = await Profile.findOne({ where: { id: profileId || 0 } })
  if (!profile) return res.status(401).end()
  req.profile = profile
  next()
}
module.exports = { getProfile }
