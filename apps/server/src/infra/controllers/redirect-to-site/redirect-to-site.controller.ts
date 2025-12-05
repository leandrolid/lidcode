import { Controller, Docs, Get, Response } from '@lidcode/framework'
import type { FastifyReply } from 'fastify'

@Controller('')
@Docs({
  tags: ['Static'],
  title: 'Static redirect to site',
  description: 'Controller to redirect to my personal site',
})
export class RedirectToSiteController {
  @Get('')
  async execute(@Response() res: FastifyReply) {
    return res.headers({ 'Content-Type': 'text/html; charset=utf-8' }).status(200).send(HOME)
  }
}

const HOME = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0ib2tsY2goMC4xNDEgMC4wMDUgMjg1LjgyMykiLz4KPHN2ZyB4PSI0IiB5PSI0IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ib2tsY2goMC40ODggMC4yNDMgMjY0LjM3NikiPgo8cGF0aCBkPSJNNCAyaDEydjJINFYyeiIvPgo8cGF0aCBkPSJNNCA2aDEwdjJINFY2eiIvPgo8cGF0aCBkPSJNNCAxMGg4djJINFYxMHoiLz4KPHN2ZyB4PSIxNiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjEyIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxOCIgcj0iNCIgZmlsbD0ib2tsY2goMC40ODggMC4yNDMgMjY0LjM3NikiLz4KPHN2ZyB4PSIxOCIgeT0iMTYiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjE4IiByPSIyIiBmaWxsPSJva2xjaCgwLjk4NSAwIDApIi8+Cjwvc3ZnPgo8L3N2Zz4KPC9zdmc+Cjwvc3ZnPgo=" />
    <title>Lidcode - Services Hub</title>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7052489958602359" crossorigin="anonymous"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'oklch(0.141 0.005 285.823)',
                        foreground: 'oklch(0.985 0 0)',
                        card: 'oklch(0.21 0.006 285.885)',
                        'card-foreground': 'oklch(0.985 0 0)',
                        primary: 'oklch(0.488 0.243 264.376)',
                        'primary-foreground': 'oklch(0.97 0.014 254.604)',
                        secondary: 'oklch(0.274 0.006 286.033)',
                        'secondary-foreground': 'oklch(0.985 0 0)',
                        muted: 'oklch(0.274 0.006 286.033)',
                        'muted-foreground': 'oklch(0.705 0.015 286.067)',
                        border: 'oklch(1 0 0 / 10%)',
                        input: 'oklch(1 0 0 / 15%)',
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', system-ui, Helvetica, Arial, sans-serif; 
            background-color: oklch(0.141 0.005 285.823);
            color: oklch(0.985 0 0);
        }
        .card-bg {
            background-color: oklch(0.21 0.006 285.885);
            border: 1px solid oklch(1 0 0 / 10%);
        }
        .text-gray-400 {
            color: oklch(0.705 0.015 286.067);
        }
        .btn-primary {
            background-color: oklch(0.488 0.243 264.376);
            color: oklch(0.97 0.014 254.604);
        }
        .btn-primary:hover {
            background-color: oklch(0.546 0.245 262.881);
        }
    </style>
</head>
<body class="bg-background text-foreground">
    <div class="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat">
        
        <!-- Header -->
        <div class="w-full max-w-3xl p-6 mb-8">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold" style="color: oklch(0.488 0.243 264.376);">
                    lidcode
                </h1>
                <a href="https://github.com/leandrolid" class="text-gray-400 hover:text-foreground transition-colors text-sm">
                    <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
            </div>
        </div>

        <!-- Main Content -->
        <div class="space-y-6 w-full max-w-3xl p-6">
            <div class="text-center space-y-4">
                <h2 class="text-2xl font-bold">Services Hub</h2>
                <h3 class="text-gray-400">
                    A collection of useful services and tools for developers, built with modern technologies and clean APIs.
                </h3>
            </div>

            <!-- ShortLid Service -->
            <div class="card-bg rounded-lg p-8">
                <div class="text-center mb-6">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto btn-primary">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">ShortLid</h3>
                    <p class="text-gray-400 mb-4">
                        Fast and reliable URL shortener service. Create short, memorable links for your projects and campaigns.
                    </p>
                </div>
                
                <div class="grid md:grid-cols-3 gap-4 text-sm mb-6">
                    <div class="flex items-center text-gray-400">
                        <svg class="w-4 h-4 mr-2" style="color: oklch(0.488 0.243 264.376)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Temporary short codes
                    </div>
                    <div class="flex items-center text-gray-400">
                        <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squircle-dashed-icon lucide-squircle-dashed"><path d="M13.77 3.043a34 34 0 0 0-3.54 0"/><path d="M13.771 20.956a33 33 0 0 1-3.541.001"/><path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44"/><path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438"/><path d="M20.957 10.23a33 33 0 0 1 0 3.54"/><path d="M3.043 10.23a34 34 0 0 0 .001 3.541"/><path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438"/><path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44"/></svg>
                        Analytics & tracking (soon)
                    </div>
                    <div class="flex items-center text-gray-400">
                        <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squircle-dashed-icon lucide-squircle-dashed"><path d="M13.77 3.043a34 34 0 0 0-3.54 0"/><path d="M13.771 20.956a33 33 0 0 1-3.541.001"/><path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44"/><path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438"/><path d="M20.957 10.23a33 33 0 0 1 0 3.54"/><path d="M3.043 10.23a34 34 0 0 0 .001 3.541"/><path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438"/><path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44"/></svg>
                        REST API available (soon)
                    </div>
                </div>
                
                <div class="text-center">
                    <a href="https://short.lidco.de" 
                       class="inline-block px-6 py-2 btn-primary rounded-md hover:btn-primary font-medium transition-colors">
                        Try ShortLid →
                    </a>
                </div>
            </div>

            <!-- Coming Soon Services -->
            <div class="card-bg rounded-lg p-8">
                <h3 class="text-lg font-semibold mb-4 text-center">Coming Soon</h3>
                <div class="flex justify-center gap-6">
                    <div class="text-center max-w-40">
                        <div class="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 mx-auto">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <h4 class="font-medium mb-2">FileLid</h4>
                        <p class="text-sm text-gray-400">
                            Temporary file sharing service with automatic cleanup.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center text-sm text-gray-400 pt-4">
                <p>Built with ❤️ by 
                    <a href="https://github.com/leandrolid" class="text-primary hover:underline">
                        leandrolid
                    </a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
