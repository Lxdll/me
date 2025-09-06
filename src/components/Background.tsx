import React, { useEffect, useRef, useState } from 'react'

const r180 = Math.PI
const r90 = Math.PI / 2
const r15 = Math.PI / 12
const color = '#88888825'
const MIN_BRANCH = 30
const LENGTH = 6
const FPS = 40

function polar2cart(x = 0, y = 0, r = 0, theta = 0) {
  const dx = r * Math.cos(theta)
  const dy = r * Math.sin(theta)
  return [x + dx, y + dy]
}

export default function BranchBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stepsRef = useRef<(() => void)[]>([])
  const prevStepsRef = useRef<(() => void)[]>([])
  const stoppedRef = useRef(false)
  const animationFrameId = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  // 初始化canvas函数，设置高DPI支持
  const initCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    canvas.style.width = size.width + 'px'
    canvas.style.height = size.height + 'px'
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    ctx.scale(dpr, dpr)
    return ctx
  }

  // 递归生长函数
  const step = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rad: number,
    counter: { value: number },
  ) => {
    const length = Math.random() * LENGTH
    counter.value++

    const [nx, ny] = polar2cart(x, y, length, rad)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(nx, ny)
    ctx.stroke()

    const rad1 = rad + Math.random() * r15
    const rad2 = rad - Math.random() * r15

    if (
      nx < -100 ||
      nx > size.width + 100 ||
      ny < -100 ||
      ny > size.height + 100
    ) {
      return
    }

    const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5

    if (Math.random() < rate) {
      stepsRef.current.push(() => step(ctx, nx, ny, rad1, counter))
    }
    if (Math.random() < rate) {
      stepsRef.current.push(() => step(ctx, nx, ny, rad2, counter))
    }
  }

  // 主循环，用requestAnimationFrame控制频率
  const animate = (ctx: CanvasRenderingContext2D) => {
    const now = performance.now()
    const interval = 1000 / FPS

    if (now - lastTimeRef.current < interval) {
      animationFrameId.current = requestAnimationFrame(() => animate(ctx))
      return
    }
    lastTimeRef.current = now

    // 把前一帧的steps存起来，清空当前steps
    prevStepsRef.current = stepsRef.current
    stepsRef.current = []

    if (prevStepsRef.current.length === 0) {
      stoppedRef.current = true
      return // 动画停止
    }

    // 50%机率继续放入steps，另一半执行（模拟抖动）
    prevStepsRef.current.forEach((fn) => {
      if (Math.random() < 0.5) {
        stepsRef.current.push(fn)
      } else {
        fn()
      }
    })

    animationFrameId.current = requestAnimationFrame(() => animate(ctx))
  }

  // 启动动画
  const start = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = initCanvas(canvas)
    ctx.clearRect(0, 0, size.width, size.height)
    ctx.lineWidth = 1
    ctx.strokeStyle = color

    stoppedRef.current = false
    stepsRef.current = []

    const randomMiddle = () => Math.random() * 0.6 + 0.2

    const initSteps: (() => void)[] = [
      () => step(ctx, randomMiddle() * size.width, -5, r90, { value: 0 }),
      () =>
        step(ctx, randomMiddle() * size.width, size.height + 5, -r90, {
          value: 0,
        }),
      () => step(ctx, -5, randomMiddle() * size.height, 0, { value: 0 }),
      () =>
        step(ctx, size.width + 5, randomMiddle() * size.height, r180, {
          value: 0,
        }),
    ]

    stepsRef.current = size.width < 500 ? initSteps.slice(0, 2) : initSteps

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }

    animationFrameId.current = requestAnimationFrame(() => animate(ctx))
  }

  // 监听窗口变化，重新start动画
  useEffect(() => {
    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // size变化时重启动画
  useEffect(() => {
    start()
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [size.width, size.height])

  const mask = 'radial-gradient(circle, transparent, black)'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        zIndex: -1,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
