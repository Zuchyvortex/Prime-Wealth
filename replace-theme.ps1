$paths = @("src/app/dashboard", "src/app/forgot-password")

foreach ($path in $paths) {
    if (Test-Path $path) {
        Get-ChildItem -Path $path -Recurse -Filter *.tsx | ForEach-Object {
            $content = Get-Content $_.FullName -Raw
            
            # Complex combinations first
            $content = $content -replace 'bg-gradient-purple-blue text-white', 'bg-gradient-neon text-[#022c22]'
            $content = $content -replace 'bg-gradient-purple-blue', 'bg-gradient-neon'
            $content = $content -replace 'from-purple-500/10 to-blue-500/10 border-purple-500/15', 'from-brand-emerald-dark/40 to-brand-emerald-deep border-brand-emerald/15'
            
            # Colors
            $content = $content -replace 'text-purple-400', 'text-brand-emerald'
            $content = $content -replace 'text-purple-500', 'text-brand-emerald'
            $content = $content -replace 'text-purple-300', 'text-brand-neon-green'
            $content = $content -replace 'text-purple-450', 'text-brand-emerald'
            
            $content = $content -replace 'bg-purple-500', 'bg-brand-emerald'
            $content = $content -replace 'bg-purple-400', 'bg-brand-emerald'
            $content = $content -replace 'bg-brand-purple', 'bg-brand-emerald'
            $content = $content -replace 'bg-purple-950', 'bg-emerald-950'
            
            $content = $content -replace 'border-purple-500', 'border-brand-emerald'
            $content = $content -replace 'border-purple-400', 'border-brand-emerald'
            $content = $content -replace 'border-purple-300', 'border-brand-emerald'
            
            $content = $content -replace 'ring-purple-500', 'ring-brand-emerald'
            $content = $content -replace 'shadow-purple-500', 'shadow-brand-emerald'
            
            $content = $content -replace 'from-purple-500', 'from-brand-emerald'
            $content = $content -replace 'to-purple-500', 'to-brand-emerald'
            $content = $content -replace 'via-purple-500', 'via-brand-emerald'
            $content = $content -replace 'from-purple-950', 'from-emerald-950'
            
            Set-Content -Path $_.FullName -Value $content -NoNewline
        }
    }
}
