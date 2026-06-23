export default async function handler(req, res) {
  const keyPreview = (process.env.ANTHROPIC_API_KEY || 'NOT FOUND').slice(0, 12);
  res.status(200).json({ recommendation: 'Key preview: ' + keyPreview });
}
