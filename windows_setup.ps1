$ErrorActionPreference = "Stop"

function Ensure-Node {
	if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
		Write-Host "Node.js bulunamadı. Kuruluyor..."
		try {
			winget install -e --id OpenJS.NodeJS.LTS --silent
		} catch {
			Write-Host "winget başarısız oldu. Lütfen Node.js LTS sürümünü manuel kurun: https://nodejs.org/en"
			throw
		}
	}
}

Ensure-Node
npm install
npm run start 