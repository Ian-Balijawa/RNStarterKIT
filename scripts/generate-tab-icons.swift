import AppKit
import CoreGraphics
import Foundation

let output = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "src/assets", isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

func draw(_ name: String, in ctx: CGContext) {
  ctx.setStrokeColor(NSColor.white.cgColor)
  ctx.setFillColor(NSColor.white.cgColor)
  ctx.setLineWidth(2)
  ctx.setLineCap(.round)
  ctx.setLineJoin(.round)
  switch name {
  case "chats":
    ctx.addPath(CGPath(roundedRect: CGRect(x: 3, y: 6, width: 18, height: 14), cornerWidth: 4, cornerHeight: 4, transform: nil))
    ctx.strokePath()
    ctx.move(to: CGPoint(x: 8, y: 6))
    ctx.addLine(to: CGPoint(x: 5, y: 3))
    ctx.addLine(to: CGPoint(x: 12, y: 6))
    ctx.strokePath()
  case "updates":
    ctx.move(to: CGPoint(x: 5, y: 7))
    ctx.addQuadCurve(to: CGPoint(x: 8, y: 13), control: CGPoint(x: 8, y: 9))
    ctx.addArc(center: CGPoint(x: 12, y: 13), radius: 4, startAngle: .pi, endAngle: 0, clockwise: true)
    ctx.addQuadCurve(to: CGPoint(x: 19, y: 7), control: CGPoint(x: 16, y: 9))
    ctx.closePath()
    ctx.strokePath()
    ctx.move(to: CGPoint(x: 10, y: 5))
    ctx.addQuadCurve(to: CGPoint(x: 14, y: 5), control: CGPoint(x: 12, y: 2))
    ctx.strokePath()
  case "communities":
    ctx.strokeEllipse(in: CGRect(x: 9, y: 13, width: 6, height: 6))
    ctx.strokeEllipse(in: CGRect(x: 2, y: 12, width: 4, height: 4))
    ctx.strokeEllipse(in: CGRect(x: 18, y: 12, width: 4, height: 4))
    ctx.move(to: CGPoint(x: 5, y: 5))
    ctx.addQuadCurve(to: CGPoint(x: 19, y: 5), control: CGPoint(x: 12, y: 13))
    ctx.strokePath()
  case "maps":
    ctx.move(to: CGPoint(x: 3, y: 5))
    ctx.addLine(to: CGPoint(x: 9, y: 7))
    ctx.addLine(to: CGPoint(x: 15, y: 5))
    ctx.addLine(to: CGPoint(x: 21, y: 7))
    ctx.addLine(to: CGPoint(x: 21, y: 19))
    ctx.addLine(to: CGPoint(x: 15, y: 17))
    ctx.addLine(to: CGPoint(x: 9, y: 19))
    ctx.addLine(to: CGPoint(x: 3, y: 17))
    ctx.closePath()
    ctx.strokePath()
    ctx.move(to: CGPoint(x: 9, y: 7))
    ctx.addLine(to: CGPoint(x: 9, y: 19))
    ctx.move(to: CGPoint(x: 15, y: 5))
    ctx.addLine(to: CGPoint(x: 15, y: 17))
    ctx.strokePath()
  default: break
  }
}

for name in ["chats", "updates", "communities", "maps"] {
  for scale in 1...3 {
    let side = 24 * scale
    guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: side, pixelsHigh: side, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0), let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else { fatalError("Could not make bitmap") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    let ctx = graphics.cgContext
    ctx.clear(CGRect(x: 0, y: 0, width: side, height: side))
    ctx.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
    draw(name, in: ctx)
    graphics.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()
    guard let png = bitmap.representation(using: .png, properties: [:]) else {fatalError("Could not encode PNG")}
    let suffix = scale == 1 ? "" : "@\(scale)x"
    try png.write(to: output.appendingPathComponent("tab_\(name)\(suffix).png"))
  }
}
