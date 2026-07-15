// Dynamic Module Registry for TVRS Supreme Dev Tools
// Utilizes Vite's glob import to automatically register plug-ins

// Eager load to ensure synchronous registry availability on dashboard boot
const moduleFiles = import.meta.glob('./*/index.jsx', { eager: true });

const modules = [];

for (const path in moduleFiles) {
  const mod = moduleFiles[path]?.default;
  if (mod && mod.id) {
    modules.push(mod);
    console.log(`🔌 [Front-End module] Registered: "${mod.name}" (${mod.id})`);
  }
}

// Export default modules array sorted by name
export default modules.sort((a, b) => a.name.localeCompare(b.name));
