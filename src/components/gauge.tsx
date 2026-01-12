import { useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

import attitudeConfig from "./gauge.attitude.json";

type GaugeConfig = {
	framebufferWidth: number;
	framebufferHeight: number;
};

export function AttitudeCanvas({
	containerWidth,
	containerHeight,
	fps = 20,
	config = attitudeConfig as GaugeConfig,
}: {
	containerWidth: number;
	containerHeight: number;
	fps?: number;
	config?: GaugeConfig;
}) {
	const ref = useRef<HTMLCanvasElement>(null);

	const native = useMemo(() => {
		const framebufferWidth = Math.max(
			1,
			Math.floor(config.framebufferWidth || 1),
		);
		const framebufferHeight = Math.max(
			1,
			Math.floor(config.framebufferHeight || 1),
		);
		return { framebufferWidth, framebufferHeight };
	}, [config.framebufferWidth, config.framebufferHeight]);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;

		const cw = Math.max(0, containerWidth);
		const ch = Math.max(0, containerHeight);
		if (cw === 0 || ch === 0) return;

		const aspect = native.framebufferWidth / native.framebufferHeight;
		const containerAspect = cw / ch;

		let displayW = cw;
		let displayH = ch;
		if (containerAspect > aspect) {
			displayH = ch;
			displayW = Math.floor(ch * aspect);
		} else {
			displayW = cw;
			displayH = Math.floor(cw / aspect);
		}

		canvas.style.width = `${Math.max(1, displayW)}px`;
		canvas.style.height = `${Math.max(1, displayH)}px`;
	}, [
		containerWidth,
		containerHeight,
		native.framebufferWidth,
		native.framebufferHeight,
	]);

	useEffect(() => {
		let alive = true;
		const canvas = ref.current!;
		const ctx = canvas.getContext("2d")!;

		let rafId = 0;
		let inFlight = false;
		let lastFrameAt = 0;
		let lastFbw = 0;
		let lastFbh = 0;

		const loop = async (t: number) => {
			if (!alive) return;

			const minDt = 1000 / fps;
			if (t - lastFrameAt < minDt || inFlight) {
				rafId = requestAnimationFrame(loop);
				return;
			}

			inFlight = true;
			lastFrameAt = t;

			try {
				const dpr = 1;

				const payload = await invoke<ArrayBuffer | number[]>(
					"render_attitude",
					{
						winW: native.framebufferWidth,
						winH: native.framebufferHeight,
						dpr,
					},
				);

				let fbw: number;
				let fbh: number;
				let pixels: Uint8ClampedArray;

				if (payload instanceof ArrayBuffer) {
					const header = new DataView(payload, 0, 8);
					fbw = header.getUint32(0, true);
					fbh = header.getUint32(4, true);
					pixels = new Uint8ClampedArray(payload, 8);
				} else {
					fbw = Math.round(native.framebufferWidth * dpr);
					fbh = Math.round(native.framebufferHeight * dpr);
					pixels = new Uint8ClampedArray(payload);
				}

				if (fbw !== lastFbw || fbh !== lastFbh) {
					lastFbw = fbw;
					lastFbh = fbh;
					canvas.width = fbw;
					canvas.height = fbh;
				}

				ctx.putImageData(new ImageData(pixels, fbw, fbh), 0, 0);
			} finally {
				inFlight = false;
				rafId = requestAnimationFrame(loop);
			}
		};

		rafId = requestAnimationFrame(loop);
		return () => {
			alive = false;
			cancelAnimationFrame(rafId);
		};
	}, [fps, native.framebufferWidth, native.framebufferHeight]);

	return <canvas ref={ref} />;
}