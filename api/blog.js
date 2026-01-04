// api/blog.js
export default function handler(req, res) {
  const posts = [
    {
      id: 1,
      title: "تجربة أول مدونة من الخادم",
      content: "هذه مدونة تجريبية من Vercel Server API",
      author: "مدير الموقع",
      date: new Date().toISOString().split('T')[0],
      slug: "first-server-post"
    },
    {
      id: 2,
      title: "كيفية استخدام API",
      content: "هذا مثال عملي لربط مدونتك مع خادم Vercel",
      author: "مدير الموقع", 
      date: new Date().toISOString().split('T')[0],
      slug: "using-api-tutorial"
    }
  ];
  
  // دعم CORS علشان الواجهة الأمامية تقدر تستخدم الـ API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(posts);
}
