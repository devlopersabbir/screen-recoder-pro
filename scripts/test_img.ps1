Add-Type -AssemblyName System.Drawing

$srcPath = "public\v1.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Output "Dimensions: $($bmp.Width) x $($bmp.Height)"

function FindAlphaEdge($stepX, $stepY, $startX, $startY) {
    $x = $startX
    $y = $startY
    for ($i = 0; $i -lt 200; $i++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 100) {
            Write-Output "Found opaque at x=$($x), y=$($y)"
            break
        }
        $x += $stepX
        $y += $stepY
    }
}

Write-Output "v1 From Left:"
FindAlphaEdge 1 0 0 256
Write-Output "v1 From Right:"
FindAlphaEdge -1 0 511 256
Write-Output "v1 From Top:"
FindAlphaEdge 0 1 256 0
Write-Output "v1 From Bottom:"
FindAlphaEdge 0 -1 256 511

# Sample horizontal center line from x=0 to x=512 to find where the dark circle starts
$y = [int]($bmp.Height / 2)
function FindEdge($stepX, $stepY, $startX, $startY) {
    $x = $startX
    $y = $startY
    for ($i = 0; $i -lt 200; $i++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 10 -and $c.G -lt 10 -and $c.B -lt 10) {
            Write-Output "Found dark ring at x=$($x), y=$($y)"
            break
        }
        $x += $stepX
        $y += $stepY
    }
}

Write-Output "From Left:"
FindEdge 1 0 0 512
Write-Output "From Right:"
FindEdge -1 0 1023 512
Write-Output "From Top:"
FindEdge 0 1 512 0
Write-Output "From Bottom:"
FindEdge 0 -1 512 1023
$bmp.Dispose()
