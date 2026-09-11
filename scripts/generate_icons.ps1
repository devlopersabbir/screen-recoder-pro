Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase, System.Drawing

function Create-LogoDrawing($size) {
    $scale = $size / 512.0
    
    $visual = New-Object System.Windows.Media.DrawingVisual
    $dc = $visual.RenderOpen()
    
    if ($scale -ne 1.0) {
        $dc.PushTransform((New-Object System.Windows.Media.ScaleTransform($scale, $scale)))
    }
    
    function Color-Brush($hex) {
        $c = [System.Windows.Media.ColorConverter]::ConvertFromString($hex)
        $brush = New-Object System.Windows.Media.SolidColorBrush($c)
        $brush.Freeze()
        return $brush
    }
    
    function Linear-Grad($x1, $y1, $x2, $y2, $stops) {
        $grad = New-Object System.Windows.Media.LinearGradientBrush
        $grad.StartPoint = New-Object System.Windows.Point($x1, $y1)
        $grad.EndPoint = New-Object System.Windows.Point($x2, $y2)
        foreach ($st in $stops) {
            $c = [System.Windows.Media.ColorConverter]::ConvertFromString($st.Color)
            $grad.GradientStops.Add((New-Object System.Windows.Media.GradientStop($c, $st.Offset)))
        }
        $grad.Freeze()
        return $grad
    }
    
    function Radial-Grad($cx, $cy, $rx, $ry, $stops) {
        $grad = New-Object System.Windows.Media.RadialGradientBrush
        $grad.Center = New-Object System.Windows.Point($cx, $cy)
        $grad.GradientOrigin = New-Object System.Windows.Point($cx, $cy)
        $grad.RadiusX = $rx
        $grad.RadiusY = $ry
        foreach ($st in $stops) {
            $c = [System.Windows.Media.ColorConverter]::ConvertFromString($st.Color)
            $grad.GradientStops.Add((New-Object System.Windows.Media.GradientStop($c, $st.Offset)))
        }
        $grad.Freeze()
        return $grad
    }

    # 1. Outer Ambient Neon Glow (Crimson & Cyber Violet)
    $ambientGlowStops = @(
        @{ Color = "#77FF1E56"; Offset = 0.0 },
        @{ Color = "#338B5CF6"; Offset = 0.5 },
        @{ Color = "#00000000"; Offset = 1.0 }
    )
    $ambientGlow = Radial-Grad 0.5 0.5 0.52 0.52 $ambientGlowStops
    $dc.DrawEllipse($ambientGlow, $null, (New-Object System.Windows.Point(256, 256)), 248, 248)

    # 2. Main Dark Disc Base
    $discBaseStops = @(
        @{ Color = "#1E1E28"; Offset = 0.0 },
        @{ Color = "#111118"; Offset = 0.5 },
        @{ Color = "#08080C"; Offset = 1.0 }
    )
    $discBaseBrush = Linear-Grad 0.1 0.1 0.9 0.9 $discBaseStops
    
    # Outer glowing rim border
    $discBorderStops = @(
        @{ Color = "#FF2E56"; Offset = 0.0 },
        @{ Color = "#A855F7"; Offset = 0.35 },
        @{ Color = "#3B82F6"; Offset = 0.7 },
        @{ Color = "#FF1E56"; Offset = 1.0 }
    )
    $discBorderBrush = Linear-Grad 0.0 0.0 1.0 1.0 $discBorderStops
    $discBorderPen = New-Object System.Windows.Media.Pen($discBorderBrush, 7.5)
    $discBorderPen.Freeze()
    
    $dc.DrawEllipse($discBaseBrush, $discBorderPen, (New-Object System.Windows.Point(256, 256)), 228, 228)

    # 3. Inner Dark Glass Sheen
    $innerSheenStops = @(
        @{ Color = "#3AFFFFFF"; Offset = 0.0 },
        @{ Color = "#0AFFFFFF"; Offset = 0.4 },
        @{ Color = "#00000000"; Offset = 0.8 }
    )
    $innerSheen = Linear-Grad 0.5 0.0 0.5 1.0 $innerSheenStops
    $dc.DrawEllipse($innerSheen, $null, (New-Object System.Windows.Point(256, 160)), 212, 120)

    # 4. Subtle Radial Inner Shadow
    $innerShadowStops = @(
        @{ Color = "#00000000"; Offset = 0.75 },
        @{ Color = "#AA000000"; Offset = 1.0 }
    )
    $innerShadow = Radial-Grad 0.5 0.5 0.5 0.5 $innerShadowStops
    $dc.DrawEllipse($innerShadow, $null, (New-Object System.Windows.Point(256, 256)), 224, 224)

    # 5. Drop Shadow for the Camera
    $camShadowBrush = Color-Brush "#88000000"
    $camShadowRect = New-Object System.Windows.Rect(84, 106, 254, 196)
    $dc.DrawRoundedRectangle($camShadowBrush, $null, $camShadowRect, 38, 38)
    
    # Camera Shadow Cone
    $shadowLensStream = New-Object System.Windows.Media.StreamGeometry
    $sCtx = $shadowLensStream.Open()
    $sCtx.BeginFigure((New-Object System.Windows.Point(336, 168)), $true, $true)
    $sCtx.LineTo((New-Object System.Windows.Point(426, 120)), $true, $false)
    $sCtx.ArcTo((New-Object System.Windows.Point(438, 132)), (New-Object System.Windows.Size(16, 16)), 0, $false, [System.Windows.Media.SweepDirection]::Clockwise, $true, $false)
    $sCtx.LineTo((New-Object System.Windows.Point(438, 276)), $true, $false)
    $sCtx.ArcTo((New-Object System.Windows.Point(426, 288)), (New-Object System.Windows.Size(16, 16)), 0, $false, [System.Windows.Media.SweepDirection]::Clockwise, $true, $false)
    $sCtx.LineTo((New-Object System.Windows.Point(336, 240)), $true, $false)
    $sCtx.Close()
    $shadowLensStream.Freeze()
    $dc.DrawGeometry($camShadowBrush, $null, $shadowLensStream)

    # 6. Camera Main Body (Crisp Modern White / Metallic Pearl)
    $camBodyStops = @(
        @{ Color = "#FFFFFF"; Offset = 0.0 },
        @{ Color = "#F8FAFC"; Offset = 0.5 },
        @{ Color = "#E2E8F0"; Offset = 1.0 }
    )
    $camBodyBrush = Linear-Grad 0.2 0.0 0.8 1.0 $camBodyStops
    $camPen = New-Object System.Windows.Media.Pen((Color-Brush "#CBD5E1"), 2.0)
    $camPen.Freeze()

    # Camera Rect (X: 80, Y: 98, W: 254, H: 196, R: 38)
    $camRect = New-Object System.Windows.Rect(80, 98, 254, 196)
    $dc.DrawRoundedRectangle($camBodyBrush, $camPen, $camRect, 38, 38)

    # 7. Camera Lens Cone on Right (X: 332 to 430, Y: 114 to 278)
    $lensStream = New-Object System.Windows.Media.StreamGeometry
    $lContext = $lensStream.Open()
    $lContext.BeginFigure((New-Object System.Windows.Point(330, 160)), $true, $true)
    $lContext.LineTo((New-Object System.Windows.Point(420, 112)), $true, $false)
    $lContext.ArcTo((New-Object System.Windows.Point(432, 124)), (New-Object System.Windows.Size(16, 16)), 0, $false, [System.Windows.Media.SweepDirection]::Clockwise, $true, $false)
    $lContext.LineTo((New-Object System.Windows.Point(432, 268)), $true, $false)
    $lContext.ArcTo((New-Object System.Windows.Point(420, 280)), (New-Object System.Windows.Size(16, 16)), 0, $false, [System.Windows.Media.SweepDirection]::Clockwise, $true, $false)
    $lContext.LineTo((New-Object System.Windows.Point(330, 232)), $true, $false)
    $lContext.Close()
    $lensStream.Freeze()
    $dc.DrawGeometry($camBodyBrush, $camPen, $lensStream)

    # 8. Camera Inner Screen (Vibrant Ruby-Crimson Gradient)
    $screenStops = @(
        @{ Color = "#FF1E56"; Offset = 0.0 },
        @{ Color = "#E11449"; Offset = 0.5 },
        @{ Color = "#C70039"; Offset = 1.0 }
    )
    $screenBrush = Linear-Grad 0.1 0.0 0.9 1.0 $screenStops
    $screenPen = New-Object System.Windows.Media.Pen((Color-Brush "#FF6B8F"), 1.5)
    $screenPen.Freeze()
    $screenRect = New-Object System.Windows.Rect(106, 126, 202, 140)
    $dc.DrawRoundedRectangle($screenBrush, $screenPen, $screenRect, 18, 18)

    # Screen Gloss Highlight
    $screenGlossStops = @(
        @{ Color = "#55FFFFFF"; Offset = 0.0 },
        @{ Color = "#00FFFFFF"; Offset = 1.0 }
    )
    $screenGloss = Linear-Grad 0.5 0.0 0.5 1.0 $screenGlossStops
    $dc.DrawRoundedRectangle($screenGloss, $null, (New-Object System.Windows.Rect(108, 128, 198, 66)), 16, 16)

    # 9. Glowing Record Dot
    $recGlowStops = @(
        @{ Color = "#FFFFFFFF"; Offset = 0.0 },
        @{ Color = "#88FFFFFF"; Offset = 0.5 },
        @{ Color = "#00FFFFFF"; Offset = 1.0 }
    )
    $recGlow = Radial-Grad 0.5 0.5 0.5 0.5 $recGlowStops
    $dc.DrawEllipse($recGlow, $null, (New-Object System.Windows.Point(144, 196)), 24, 24)
    $dc.DrawEllipse((Color-Brush "#FFFFFF"), $null, (New-Object System.Windows.Point(144, 196)), 15, 15)

    # 10. "REC" Typography inside the screen
    $recTypeface = New-Object System.Windows.Media.Typeface(
        (New-Object System.Windows.Media.FontFamily("Segoe UI, Montserrat, Arial, sans-serif")),
        [System.Windows.FontStyles]::Normal,
        [System.Windows.FontWeights]::ExtraBold,
        [System.Windows.FontStretches]::Normal
    )
    
    $recFormattedText = New-Object System.Windows.Media.FormattedText(
        "REC",
        [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Windows.FlowDirection]::LeftToRight,
        $recTypeface,
        46,
        (Color-Brush "#FFFFFF"),
        1.0
    )
    $dc.DrawText($recFormattedText, (New-Object System.Windows.Point(176, 170)))

    # 11. Sleek Angled "Pro" Banner
    $dc.PushTransform((New-Object System.Windows.Media.RotateTransform(-12, 330, 385)))

    # Pro Badge Shadow
    $badgeShadow = Color-Brush "#AA000000"
    $dc.DrawRoundedRectangle($badgeShadow, $null, (New-Object System.Windows.Rect(218, 362, 206, 72)), 28, 28)

    # Pro Badge Body Gradient
    $badgeStops = @(
        @{ Color = "#FF1E56"; Offset = 0.0 },
        @{ Color = "#E11449"; Offset = 0.55 },
        @{ Color = "#9333EA"; Offset = 1.0 }
    )
    $badgeBrush = Linear-Grad 0.0 0.0 1.0 1.0 $badgeStops
    $badgePen = New-Object System.Windows.Media.Pen((Color-Brush "#FFA4B9"), 2.5)
    $badgePen.Freeze()
    $badgeRect = New-Object System.Windows.Rect(214, 356, 206, 72)
    $dc.DrawRoundedRectangle($badgeBrush, $badgePen, $badgeRect, 28, 28)

    # Pro Badge Top Sheen
    $badgeSheenStops = @(
        @{ Color = "#88FFFFFF"; Offset = 0.0 },
        @{ Color = "#00FFFFFF"; Offset = 1.0 }
    )
    $badgeSheen = Linear-Grad 0.5 0.0 0.5 1.0 $badgeSheenStops
    $dc.DrawRoundedRectangle($badgeSheen, $null, (New-Object System.Windows.Rect(218, 358, 198, 32)), 14, 14)

    # "Pro" Text
    $proTypeface = New-Object System.Windows.Media.Typeface(
        (New-Object System.Windows.Media.FontFamily("Segoe UI, Arial, sans-serif")),
        [System.Windows.FontStyles]::Normal,
        [System.Windows.FontWeights]::Black,
        [System.Windows.FontStretches]::Normal
    )
    
    $proShadow = New-Object System.Windows.Media.FormattedText(
        "Pro",
        [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Windows.FlowDirection]::LeftToRight,
        $proTypeface,
        48,
        (Color-Brush "#77000000"),
        1.0
    )
    $dc.DrawText($proShadow, (New-Object System.Windows.Point(269, 366)))

    $proText = New-Object System.Windows.Media.FormattedText(
        "Pro",
        [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Windows.FlowDirection]::LeftToRight,
        $proTypeface,
        48,
        (Color-Brush "#FFFFFF"),
        1.0
    )
    $dc.DrawText($proText, (New-Object System.Windows.Point(267, 364)))

    $dc.Pop() # pop rotation

    if ($scale -ne 1.0) {
        $dc.Pop() # pop scale
    }

    $dc.Close()
    
    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap(
        $size, $size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32
    )
    $rtb.Render($visual)
    return $rtb
}

function Save-BitmapAsPng($rtb, $outputPath) {
    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $frame = [System.Windows.Media.Imaging.BitmapFrame]::Create($rtb)
    $encoder.Frames.Add($frame)
    
    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $stream = [System.IO.File]::Create($outputPath)
    $encoder.Save($stream)
    $stream.Close()
    Write-Output "Generated: $outputPath ($($rtb.PixelWidth)x$($rtb.PixelHeight))"
}

$sizes = @(
    @{ Path = "public\v1.png"; Size = 512 },
    @{ Path = "public\icons\icon128.png"; Size = 128 },
    @{ Path = "public\icons\icon48.png"; Size = 48 },
    @{ Path = "public\icons\icon38.png"; Size = 38 },
    @{ Path = "public\icons\icon32.png"; Size = 32 },
    @{ Path = "public\icons\icon19.png"; Size = 19 },
    @{ Path = "public\icons\icon16.png"; Size = 16 }
)

foreach ($item in $sizes) {
    $rtb = Create-LogoDrawing $item.Size
    Save-BitmapAsPng $rtb $item.Path
}

Write-Output "All icons regenerated!"
