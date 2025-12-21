const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = ['loanRoutes.js', 'userRoutes.js', 'adminRoutes.js'];

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const controllerName = file.replace('Routes.js', 'Controller');
    
    // For loanRoutes and userRoutes, convert destructured imports to controller instance
    if (file === 'loanRoutes.js' || file === 'userRoutes.js') {
        // Replace destructured import with controller instance
        content = content.replace(
            /const\s+{[^}]+}\s*=\s*require\('\.\.\/controllers\/(\w+Controller)'\);/,
            "const $1 = require('../controllers/$1');"
        );
        
        // Replace direct function calls with controller method calls
        content = content.replace(/\b(\w+),?\s*$/gm, (match, p1) => {
            if (p1 && !['router', 'protect', 'authorize', 'express', 'module'].includes(p1)) {
                return `${controllerName}.${p1}`;
            }
            return match;
        });
    }
    
    console.log(`Fixed: ${file}`);
    fs.writeFileSync(filePath, content);
});

console.log('Route files fixed!');
