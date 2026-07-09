const fs = require('fs');
const path = require('path');

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("No GITHUB_TOKEN");

  const repo = "MuhammetFurkanYilmaz/simco-manager";
  const tag = "v1.1.16";

  // 1. Get Release by Tag
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    console.error("Release not found or error:", await res.text());
    return;
  }
  
  const release = await res.json();
  const uploadUrlBase = release.upload_url.split('{')[0];

  // 2. Delete existing assets
  for (const asset of release.assets) {
    console.log("Deleting old asset:", asset.name);
    await fetch(asset.url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // 3. Upload new assets
  const files = ['simco-manager-chrome-v1.1.16.zip', 'simco-manager-firefox-v1.1.16.zip'];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const stat = fs.statSync(filePath);
    console.log("Uploading:", file, "Size:", stat.size);
    
    const uploadRes = await fetch(`${uploadUrlBase}?name=${file}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/zip',
        'Content-Length': stat.size
      },
      body: fs.createReadStream(filePath)
    });
    
    if (uploadRes.ok) {
      console.log("Successfully uploaded:", file);
    } else {
      console.error("Failed to upload:", file, await uploadRes.text());
    }
  }
}

main().catch(console.error);
