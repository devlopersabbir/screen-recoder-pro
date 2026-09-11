Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase, System.Drawing

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

# 1. Generate Screenshot 1 (1280x800) - Welcome & Setup / Hero Screenshot
function Generate-Screenshot1($outputPath) {
    $w = 1280
    $h = 800
    $visual = New-Object System.Windows.Media.DrawingVisual
    $dc = $visual.RenderOpen()

    # Background gradient: Deep Midnight Nebula
    $bgStops = @(
        @{ Color = "#0D0E1A"; Offset = 0.0 },
        @{ Color = "#090A10"; Offset = 0.5 },
        @{ Color = "#050508"; Offset = 1.0 }
    )
    $bgBrush = Linear-Grad 0.0 0.0 1.0 1.0 $bgStops
    $dc.DrawRectangle($bgBrush, $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))

    # Ambient glow in top-left (Crimson)
    $ambient1Stops = @(
        @{ Color = "#33FF1E56"; Offset = 0.0 },
        @{ Color = "#00FF1E56"; Offset = 1.0 }
    )
    $ambient1 = Radial-Grad 0.2 0.2 0.45 0.45 $ambient1Stops
    $dc.DrawRectangle($ambient1, $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))

    # Ambient glow in bottom-right (Violet)
    $ambient2Stops = @(
        @{ Color = "#337C3AED"; Offset = 0.0 },
        @{ Color = "#007C3AED"; Offset = 1.0 }
    )
    $ambient2 = Radial-Grad 0.8 0.7 0.45 0.45 $ambient2Stops
    $dc.DrawRectangle($ambient2, $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))

    # Subtle Grid pattern
    $gridPen = New-Object System.Windows.Media.Pen((Color-Brush "#08FFFFFF"), 1.0)
    $gridPen.Freeze()
    for ($gx = 0; $gx -lt $w; $gx += 40) {
        $dc.DrawLine($gridPen, (New-Object System.Windows.Point($gx, 0)), (New-Object System.Windows.Point($gx, $h)))
    }
    for ($gy = 0; $gy -lt $h; $gy += 40) {
        $dc.DrawLine($gridPen, (New-Object System.Windows.Point(0, $gy)), (New-Object System.Windows.Point($w, $gy)))
    }

    # Left Column: Typography & Feature Highlights
    # Top Tag: "100% PRIVATE & LOCAL-FIRST"
    $tagBg = Color-Brush "#1A1A2E"
    $tagBorder = New-Object System.Windows.Media.Pen((Color-Brush "#4338CA"), 1.5)
    $tagBorder.Freeze()
    $dc.DrawRoundedRectangle($tagBg, $tagBorder, (New-Object System.Windows.Rect(72, 70, 270, 36)), 18, 18)

    $tagTf = New-Object System.Windows.Media.Typeface((New-Object System.Windows.Media.FontFamily("Segoe UI, sans-serif")), [System.Windows.FontStyles]::Normal, [System.Windows.FontWeights]::SemiBold, [System.Windows.FontStretches]::Normal)
    $tagText = New-Object System.Windows.Media.FormattedText("* 100% PRIVATE & LOCAL-FIRST", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 13, (Color-Brush "#A5B4FC"), 1.0)
    $dc.DrawText($tagText, (New-Object System.Windows.Point(88, 79)))

    # Main Headline
    $headTf = New-Object System.Windows.Media.Typeface((New-Object System.Windows.Media.FontFamily("Segoe UI, Montserrat, sans-serif")), [System.Windows.FontStyles]::Normal, [System.Windows.FontWeights]::Bold, [System.Windows.FontStretches]::Normal)
    $h1 = New-Object System.Windows.Media.FormattedText("Record Screen,`nWindow, or Tab`nwith One Click.", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $headTf, 48, (Color-Brush "#FFFFFF"), 1.0)
    $dc.DrawText($h1, (New-Object System.Windows.Point(72, 130)))

    # Subtitle
    $subTf = New-Object System.Windows.Media.Typeface((New-Object System.Windows.Media.FontFamily("Segoe UI, sans-serif")), [System.Windows.FontStyles]::Normal, [System.Windows.FontWeights]::Normal, [System.Windows.FontStretches]::Normal)
    $sub = New-Object System.Windows.Media.FormattedText("Simple, intuitive interface directly in your browser.`nZero cloud uploads, no watermarks, and 100% offline.", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $subTf, 19, (Color-Brush "#94A3B8"), 1.0)
    $dc.DrawText($sub, (New-Object System.Windows.Point(72, 320)))

    # Feature Checklist Badges
    $features = @(
        "[+] Zero Cloud Uploads - 100% Private",
        "[+] High-Quality WebM Export (VP9/VP8)",
        "[+] No Watermarks - No Time Limits",
        "[+] Works Completely Offline"
    )

    $fy = 390
    foreach ($feat in $features) {
        $fRect = New-Object System.Windows.Rect(72, $fy, 420, 44)
        $fBrush = Color-Brush "#111827"
        $fPen = New-Object System.Windows.Media.Pen((Color-Brush "#1F2937"), 1.0)
        $fPen.Freeze()
        $dc.DrawRoundedRectangle($fBrush, $fPen, $fRect, 10, 10)

        $fText = New-Object System.Windows.Media.FormattedText($feat, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 15, (Color-Brush "#E2E8F0"), 1.0)
        $dc.DrawText($fText, (New-Object System.Windows.Point(88, ($fy + 12))))
        $fy += 56
    }

    # Right Column: Sleek Glassmorphism App Mockup Card
    $cardRect = New-Object System.Windows.Rect(640, 70, 560, 660)
    
    # Outer Glow for card
    $cardGlowStops = @(
        @{ Color = "#33FF1E56"; Offset = 0.0 },
        @{ Color = "#117C3AED"; Offset = 0.5 },
        @{ Color = "#00000000"; Offset = 1.0 }
    )
    $cardGlow = Radial-Grad 0.5 0.5 0.6 0.6 $cardGlowStops
    $dc.DrawRoundedRectangle($cardGlow, $null, (New-Object System.Windows.Rect(620, 50, 600, 700)), 36, 36)

    # Card Body (Glass dark obsidian)
    $cardBgStops = @(
        @{ Color = "#1A1A28"; Offset = 0.0 },
        @{ Color = "#12121D"; Offset = 0.6 },
        @{ Color = "#0B0B12"; Offset = 1.0 }
    )
    $cardBg = Linear-Grad 0.1 0.0 0.9 1.0 $cardBgStops
    $cardBorder = New-Object System.Windows.Media.Pen((Color-Brush "#334155"), 2.0)
    $cardBorder.Freeze()
    $dc.DrawRoundedRectangle($cardBg, $cardBorder, $cardRect, 28, 28)

    # Card Header Bar
    $barRect = New-Object System.Windows.Rect(640, 70, 560, 56)
    $barBg = Color-Brush "#151522"
    $dc.DrawRoundedRectangle($barBg, $null, $barRect, 28, 28)
    $dc.DrawRectangle($barBg, $null, (New-Object System.Windows.Rect(640, 98, 560, 28)))

    # Window dots
    $dc.DrawEllipse((Color-Brush "#EF4444"), $null, (New-Object System.Windows.Point(674, 98)), 6, 6)
    $dc.DrawEllipse((Color-Brush "#F59E0B"), $null, (New-Object System.Windows.Point(694, 98)), 6, 6)
    $dc.DrawEllipse((Color-Brush "#10B981"), $null, (New-Object System.Windows.Point(714, 98)), 6, 6)

    # Title in Header
    $hdrText = New-Object System.Windows.Media.FormattedText("Screen Recorder Pro - Extension", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 14, (Color-Brush "#94A3B8"), 1.0)
    $dc.DrawText($hdrText, (New-Object System.Windows.Point(744, 88)))

    # Inside Card: App Logo & Hero Section
    $v1Uri = New-Object System.Uri((Resolve-Path "public\v1.png").Path)
    $logoBmp = New-Object System.Windows.Media.Imaging.BitmapImage($v1Uri)
    $dc.DrawImage($logoBmp, (New-Object System.Windows.Rect(840, 150, 160, 160)))

    # App Title inside popup
    $appTitleText = New-Object System.Windows.Media.FormattedText("Screen Recorder Pro", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $headTf, 26, (Color-Brush "#FFFFFF"), 1.0)
    $dc.DrawText($appTitleText, (New-Object System.Windows.Point(785, 320)))

    # Status Pill
    $statusRect = New-Object System.Windows.Rect(845, 360, 150, 28)
    $dc.DrawRoundedRectangle((Color-Brush "#064E3B"), (New-Object System.Windows.Media.Pen((Color-Brush "#059669"), 1.0)), $statusRect, 14, 14)
    $statusText = New-Object System.Windows.Media.FormattedText("o Ready to Record", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 12, (Color-Brush "#34D399"), 1.0)
    $dc.DrawText($statusText, (New-Object System.Windows.Point(865, 366)))

    # Capture Source Selector Mockup
    $modes = @(
        @{ Label = "Entire Screen"; Sub = "[Screen]"; Selected = $true },
        @{ Label = "Window"; Sub = "[App]"; Selected = $false },
        @{ Label = "Browser Tab"; Sub = "[Tab]"; Selected = $false }
    )
    $mx = 680
    foreach ($m in $modes) {
        $mRect = New-Object System.Windows.Rect($mx, 410, 150, 72)
        $mBg = if ($m.Selected) { Color-Brush "#1E1B4B" } else { Color-Brush "#0F172A" }
        $mBorderColor = if ($m.Selected) { "#6366F1" } else { "#1E293B" }
        $mPen = New-Object System.Windows.Media.Pen((Color-Brush $mBorderColor), 1.5)
        $mPen.Freeze()
        $dc.DrawRoundedRectangle($mBg, $mPen, $mRect, 14, 14)

        $mSub = New-Object System.Windows.Media.FormattedText($m.Sub, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 12, (Color-Brush "#818CF8"), 1.0)
        $mSub.TextAlignment = [System.Windows.TextAlignment]::Center
        $dc.DrawText($mSub, (New-Object System.Windows.Point(($mx + 75), 424)))

        $mLabel = New-Object System.Windows.Media.FormattedText($m.Label, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 14, (Color-Brush "#F8FAFC"), 1.0)
        $mLabel.TextAlignment = [System.Windows.TextAlignment]::Center
        $dc.DrawText($mLabel, (New-Object System.Windows.Point(($mx + 75), 446)))
        $mx += 165
    }

    # Big Glowing "Start Recording" Button
    $btnRect = New-Object System.Windows.Rect(680, 510, 480, 64)
    $btnStops = @(
        @{ Color = "#FF1E56"; Offset = 0.0 },
        @{ Color = "#E11449"; Offset = 0.5 },
        @{ Color = "#9333EA"; Offset = 1.0 }
    )
    $btnBrush = Linear-Grad 0.0 0.0 1.0 1.0 $btnStops
    $btnGlow = Radial-Grad 0.5 0.5 0.6 0.6 @(@{ Color = "#66FF1E56"; Offset = 0.0 }, @{ Color = "#00FF1E56"; Offset = 1.0 })
    $dc.DrawRoundedRectangle($btnGlow, $null, (New-Object System.Windows.Rect(670, 500, 500, 84)), 36, 36)
    
    $btnPen = New-Object System.Windows.Media.Pen((Color-Brush "#FF85A2"), 2.0)
    $btnPen.Freeze()
    $dc.DrawRoundedRectangle($btnBrush, $btnPen, $btnRect, 20, 20)

    # Button Text
    $btnText = New-Object System.Windows.Media.FormattedText("Start Recording", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $headTf, 20, (Color-Brush "#FFFFFF"), 1.0)
    $dc.DrawText($btnText, (New-Object System.Windows.Point(835, 528)))

    # Audio & Settings Quick Toggles
    $audRect = New-Object System.Windows.Rect(680, 598, 480, 48)
    $dc.DrawRoundedRectangle((Color-Brush "#0B0F19"), (New-Object System.Windows.Media.Pen((Color-Brush "#1E293B"), 1.0)), $audRect, 12, 12)
    $audText = New-Object System.Windows.Media.FormattedText("Audio: System + Mic (ON)   |   Quality: 1080p 60FPS WebM", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tagTf, 13, (Color-Brush "#94A3B8"), 1.0)
    $dc.DrawText($audText, (New-Object System.Windows.Point(740, 612)))

    $dc.Close()

    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($w, $h, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($visual)

    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    
    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $stream = [System.IO.File]::Create($outputPath)
    $encoder.Save($stream)
    $stream.Close()
    Write-Output "Generated Screenshot: $outputPath"
}

# 2. Generate Marquee Promo Tile (1400x560)
function Generate-MarqueePromo($outputPath) {
    $w = 1400
    $h = 560
    $visual = New-Object System.Windows.Media.DrawingVisual
    $dc = $visual.RenderOpen()

    $bgStops = @(
        @{ Color = "#0D0E1A"; Offset = 0.0 },
        @{ Color = "#090A10"; Offset = 0.5 },
        @{ Color = "#050508"; Offset = 1.0 }
    )
    $bgBrush = Linear-Grad 0.0 0.0 1.0 1.0 $bgStops
    $dc.DrawRectangle($bgBrush, $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))

    $ambient1Stops = @(@{ Color = "#33FF1E56"; Offset = 0.0 }, @{ Color = "#00FF1E56"; Offset = 1.0 })
    $dc.DrawRectangle((Radial-Grad 0.15 0.5 0.5 0.5 $ambient1Stops), $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))
    $ambient2Stops = @(@{ Color = "#337C3AED"; Offset = 0.0 }, @{ Color = "#007C3AED"; Offset = 1.0 })
    $dc.DrawRectangle((Radial-Grad 0.85 0.5 0.5 0.5 $ambient2Stops), $null, (New-Object System.Windows.Rect(0, 0, $w, $h)))

    $gridPen = New-Object System.Windows.Media.Pen((Color-Brush "#08FFFFFF"), 1.0)
    $gridPen.Freeze()
    for ($gx = 0; $gx -lt $w; $gx += 40) { $dc.DrawLine($gridPen, (New-Object System.Windows.Point($gx, 0)), (New-Object System.Windows.Point($gx, $h))) }
    for ($gy = 0; $gy -lt $h; $gy += 40) { $dc.DrawLine($gridPen, (New-Object System.Windows.Point(0, $gy)), (New-Object System.Windows.Point($w, $gy))) }

    $v1Uri = New-Object System.Uri((Resolve-Path "public\v1.png").Path)
    $logoBmp = New-Object System.Windows.Media.Imaging.BitmapImage($v1Uri)
    $dc.DrawImage($logoBmp, (New-Object System.Windows.Rect(100, 110, 340, 340)))

    $headTf = New-Object System.Windows.Media.Typeface((New-Object System.Windows.Media.FontFamily("Segoe UI, Montserrat, sans-serif")), [System.Windows.FontStyles]::Normal, [System.Windows.FontWeights]::Bold, [System.Windows.FontStretches]::Normal)
    $subTf = New-Object System.Windows.Media.Typeface((New-Object System.Windows.Media.FontFamily("Segoe UI, sans-serif")), [System.Windows.FontStyles]::Normal, [System.Windows.FontWeights]::SemiBold, [System.Windows.FontStretches]::Normal)

    $h1 = New-Object System.Windows.Media.FormattedText("Screen Recorder Pro", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $headTf, 54, (Color-Brush "#FFFFFF"), 1.0)
    $dc.DrawText($h1, (New-Object System.Windows.Point(490, 130)))

    $sub = New-Object System.Windows.Media.FormattedText("Clean, private, zero-bloat screen recording for your browser.", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $subTf, 22, (Color-Brush "#CBD5E1"), 1.0)
    $dc.DrawText($sub, (New-Object System.Windows.Point(490, 205)))

    $badges = @("100% Offline", "No Watermarks", "High Quality WebM", "Full Screen & Tab Capture")
    $bx = 490
    $by = 280
    foreach ($b in $badges) {
        $bRect = New-Object System.Windows.Rect($bx, $by, 190, 42)
        $dc.DrawRoundedRectangle((Color-Brush "#161626"), (New-Object System.Windows.Media.Pen((Color-Brush "#3730A3"), 1.2)), $bRect, 10, 10)
        $bText = New-Object System.Windows.Media.FormattedText("[*] $b", [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $subTf, 13, (Color-Brush "#E0E7FF"), 1.0)
        $dc.DrawText($bText, (New-Object System.Windows.Point(($bx + 14), ($by + 11))))
        $bx += 205
        if ($bx -gt 1100) { $bx = 490; $by += 54 }
    }

    $dc.Close()
    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($w, $h, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($visual)

    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    $stream = [System.IO.File]::Create($outputPath)
    $encoder.Save($stream)
    $stream.Close()
    Write-Output "Generated Marquee Promo: $outputPath"
}

# Run generation
Generate-Screenshot1 "screenshots\screenshot1_welcome.png"
Generate-MarqueePromo "screenshots\promo_marquee.png"
Write-Output "Screenshots created successfully!"
