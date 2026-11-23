/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, poweredByHeader: false, redirects: async()=>[{source:"/editor",destination:"/dashboard/designs",permanent:false},{source:"/editor/new",destination:"/dashboard/designs?create=1",permanent:false}] };
export default nextConfig;
