import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEventHandler } from "react";
import { createPortal } from "react-dom";
import type { Layout } from "react-grid-layout";
import { InstrumentWorkspace } from "./components/workspace/InstrumentWorkspace";
import type { WorkspaceView } from "./components/workspace/InstrumentWorkspace";
import type { InstrumentInstance } from "./components/workspace/types";
import { ControlSidebar } from "./components/sidebar/ControlSidebar";
import { Titlebar } from "./components/titlebar/Titlebar";
import {
	CANVAS_PX,
	GRID_PX,
	getCanvasGrid,
} from "./components/workspace/constants";

function newId() {
	return (
		(globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
		`inst_${Date.now()}_${Math.random().toString(16).slice(2)}`
	);
}

function clampLayoutToInstruments(
	layout: Layout[],
	instruments: InstrumentInstance[],
) {
	const ids = new Set(instruments.map((i) => i.id));
	return layout.filter((l) => ids.has(String(l.i)));
}

const WORKSPACE_STORAGE_KEY = "iwe.workspace.v1";

type WorkspaceUiState = {
	sidebarWidth?: number;
};

function createDefaultWorkspace(): {
	instruments: InstrumentInstance[];
	layout: Layout[];
	view?: WorkspaceView;
	ui?: WorkspaceUiState;
} {
	const id = newId();
	return {
		instruments: [{ id, title: "Attitude", kind: "attitude" }],
		layout: [{ i: id, x: 0, y: 0, w: 32, h: 32, minW: 20, minH: 20 }],
	};
}

function loadWorkspace(): {
	instruments: InstrumentInstance[];
	layout: Layout[];
	view?: WorkspaceView;
	ui?: WorkspaceUiState;
} {
	try {
		const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
		if (!raw) return createDefaultWorkspace();
		const parsed = JSON.parse(raw) as {
			instruments?: InstrumentInstance[];
			layout?: Layout[];
			view?: Partial<WorkspaceView>;
			ui?: Partial<WorkspaceUiState>;
		};

		const instruments = Array.isArray(parsed.instruments)
			? parsed.instruments
			: createDefaultWorkspace().instruments;
		const layout = Array.isArray(parsed.layout)
			? parsed.layout
			: createDefaultWorkspace().layout;

		const clamped = clampLayoutToInstruments(layout, instruments);
		if (instruments.length === 0) return createDefaultWorkspace();

		const v = parsed.view;
		const view =
			v &&
			typeof v.x === "number" &&
			typeof v.y === "number" &&
			typeof v.scale === "number" &&
			Number.isFinite(v.x) &&
			Number.isFinite(v.y) &&
			Number.isFinite(v.scale)
				? ({ x: v.x, y: v.y, scale: v.scale } satisfies WorkspaceView)
				: undefined;

		const uiRaw = parsed.ui;
		const sidebarWidth =
			uiRaw &&
			typeof uiRaw.sidebarWidth === "number" &&
			Number.isFinite(uiRaw.sidebarWidth) &&
			uiRaw.sidebarWidth >= 240 &&
			uiRaw.sidebarWidth <= 1200
				? uiRaw.sidebarWidth
				: undefined;

		const ui: WorkspaceUiState | undefined =
			sidebarWidth !== undefined ? { sidebarWidth } : undefined;

		return { instruments, layout: clamped, view, ui };
	} catch {
		return createDefaultWorkspace();
	}
}

function clampViewToCanvas(
	view: WorkspaceView,
	viewport: { width: number; height: number },
): WorkspaceView {
	const { width, height } = viewport;
	if (width <= 0 || height <= 0) return view;

	const canvasScaled = CANVAS_PX * view.scale;
	const minX = width - canvasScaled;
	const maxX = 0;
	const minY = height - canvasScaled;
	const maxY = 0;

	const clamp = (v: number, min: number, max: number) =>
		Math.min(max, Math.max(min, v));

	const x = minX > maxX ? (minX + maxX) / 2 : clamp(view.x, minX, maxX);
	const y = minY > maxY ? (minY + maxY) / 2 : clamp(view.y, minY, maxY);

	return { ...view, x, y };
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

		const initialWorkspace = useMemo(() => loadWorkspace(), []);
		const initialHadView = useMemo(
			() => Boolean(initialWorkspace.view),
			[initialWorkspace],
		);

		const [sidebarWidth, setSidebarWidth] = useState(
			() => initialWorkspace.ui?.sidebarWidth ?? 360,
		);
		const resizingSidebarRef = useRef(false);
		const sidebarStartXRef = useRef(0);
		const sidebarStartWidthRef = useRef(360);

		const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(
			null,
		);

		const [instruments, setInstruments] = useState<InstrumentInstance[]>(
			() => initialWorkspace.instruments,
		);

		const [layout, setLayout] = useState<Layout[]>(
			() => initialWorkspace.layout,
		);

		const [view, setView] = useState<WorkspaceView>(
			() => initialWorkspace.view ?? { x: 0, y: 0, scale: 1 },
		);
		const [viewportSize, setViewportSize] = useState<{
			width: number;
			height: number;
		}>({
			width: 0,
			height: 0,
		});

		useEffect(() => {
			setView((prev) => clampViewToCanvas(prev, viewportSize));
		}, [viewportSize]);

		const didInitViewRef = useRef(false);
		useEffect(() => {
			if (didInitViewRef.current) return;
			if (viewportSize.width <= 0 || viewportSize.height <= 0) return;

			setView((prev) => {
				const next = initialHadView
					? prev
					: {
							...prev,
							x: viewportSize.width / 2 - (CANVAS_PX / 2) * prev.scale,
							y: viewportSize.height / 2 - (CANVAS_PX / 2) * prev.scale,
						};
				return clampViewToCanvas(next, viewportSize);
			});

			didInitViewRef.current = true;
		}, [viewportSize, initialHadView]);

		const setViewClamped: React.Dispatch<
			React.SetStateAction<WorkspaceView>
		> = (next) => {
			setView((prev) => {
				const raw = typeof next === "function" ? next(prev) : next;
				return clampViewToCanvas(raw, viewportSize);
			});
		};

		const persistTimer = useRef<number | null>(null);
		useEffect(() => {
			if (persistTimer.current) window.clearTimeout(persistTimer.current);
			persistTimer.current = window.setTimeout(() => {
				try {
					localStorage.setItem(
						WORKSPACE_STORAGE_KEY,
						JSON.stringify({
							instruments,
							layout,
							view,
							ui: {
								sidebarWidth,
							},
						}),
					);
				} catch {
					// ignore
				}
			}, 150);
			return () => {
				if (persistTimer.current) window.clearTimeout(persistTimer.current);
			};
		}, [instruments, layout, view, sidebarWidth]);

		const usedTitles = useMemo(
			() => new Set(instruments.map((i) => i.title)),
			[instruments],
		);

		const makeUniqueTitle = (baseTitle: string) => {
			let title = baseTitle;
			let n = 2;
			while (usedTitles.has(title)) {
				title = `${baseTitle} (${n++})`;
			}
			return title;
		};

		const clampedLayout = useMemo(
			() => clampLayoutToInstruments(layout, instruments),
			[layout, instruments],
		);

		useEffect(() => {
			setLayout((prev) => {
				const present = new Set(prev.map((l) => String(l.i)));
				const missing = instruments.filter((inst) => !present.has(inst.id));
				if (missing.length === 0) return prev;

				let nextY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
				const additions: Layout[] = missing.map((inst) => {
					const isAttitude = inst.kind === "attitude";
					const item: Layout = {
						i: inst.id,
						x: 0,
						y: nextY,
						w: 32,
						h: isAttitude ? 32 : 26,
						minW: 20,
						minH: isAttitude ? 20 : 18,
					};
					nextY += item.h;
					return item;
				});

				return [...prev, ...additions];
			});
		}, [instruments]);

		const onCenterInstrument = (id: string) => {
			const item = clampedLayout.find((l) => String(l.i) === id);
			if (!item) return;
			if (viewportSize.width <= 0 || viewportSize.height <= 0) return;

			const { originX, originY } = getCanvasGrid();
			const worldCenterX = (item.x + originX + item.w / 2) * GRID_PX;
			const worldCenterY = (item.y + originY + item.h / 2) * GRID_PX;

			setViewClamped((prev) => ({
				...prev,
				x: viewportSize.width / 2 - worldCenterX * prev.scale,
				y: viewportSize.height / 2 - worldCenterY * prev.scale,
			}));
		};

		const onAddInstrumentClick = () => {
			fileInputRef.current?.click();
		};

		const onFilePicked: ChangeEventHandler<HTMLInputElement> = (e) => {
			const file = e.target.files?.[0];
			e.target.value = "";
			if (!file) return;

			const id = newId();
			const baseTitle = file.name;
			const title = makeUniqueTitle(baseTitle);

			setInstruments((prev) => [
				...prev,
				{ id, title, kind: "external", sourceFileName: file.name },
			]);
			setLayout((prev) => {
				const nextY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
				return [
					...prev,
					{ i: id, x: 0, y: nextY, w: 32, h: 26, minW: 20, minH: 18 },
				];
			});
		};

		const onRemoveInstrument = (id: string) => {
			setInstruments((prev) => prev.filter((i) => i.id !== id));
			setLayout((prev) => prev.filter((l) => String(l.i) !== id));
		};

		const onAddTestGauge = () => {
			const id = newId();
			const title = makeUniqueTitle("Attitude");
			setInstruments((prev) => [...prev, { id, title, kind: "attitude" }]);
			setLayout((prev) => {
				const nextY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
				return [
					...prev,
					{ i: id, x: 0, y: nextY, w: 32, h: 32, minW: 20, minH: 20 },
				];
			});
		};

		useEffect(() => {
			if (!ctxMenu) return;
			const onMouseDown = (e: MouseEvent) => {
				const t = e.target as HTMLElement;
				if (t.closest?.("[data-contextmenu-portal]")) return;
				setCtxMenu(null);
			};
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") setCtxMenu(null);
			};
			document.addEventListener("mousedown", onMouseDown);
			document.addEventListener("keydown", onKeyDown);
			return () => {
				document.removeEventListener("mousedown", onMouseDown);
				document.removeEventListener("keydown", onKeyDown);
			};
		}, [ctxMenu]);

		return (
			<div className="flex h-full w-full flex-col overflow-hidden dark">
				<Titlebar />

				<div className="appRoot min-h-0 flex-1 overflow-hidden">
					<div className="relative shrink-0" style={{ width: sidebarWidth }}>
						<ControlSidebar
							instruments={instruments}
							onCenterInstrument={onCenterInstrument}
							onAddInstrument={onAddInstrumentClick}
							onAddTestGauge={onAddTestGauge}
						/>

						<div
							className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/10"
							onPointerDown={(e) => {
								resizingSidebarRef.current = true;
								sidebarStartXRef.current = e.clientX;
								sidebarStartWidthRef.current = sidebarWidth;
								(e.currentTarget as HTMLDivElement).setPointerCapture(
									e.pointerId,
								);
							}}
							onPointerMove={(e) => {
								if (!resizingSidebarRef.current) return;
								const dx = e.clientX - sidebarStartXRef.current;
								const next = sidebarStartWidthRef.current + dx;

								const minW = 280;
								const maxW = Math.max(
									minW,
									Math.floor(window.innerWidth * 0.7),
								);
								setSidebarWidth(Math.max(minW, Math.min(maxW, next)));
							}}
							onPointerUp={() => {
								resizingSidebarRef.current = false;
							}}
							onPointerCancel={() => {
								resizingSidebarRef.current = false;
							}}
						/>
					</div>

					<main className="workspace min-h-0">
						<div className="workspaceHeader">
							<div className="workspaceTitle">Workspace</div>
							<div className="text-xs text-white/50">Right click to add</div>
						</div>

						<InstrumentWorkspace
							instruments={instruments}
							layout={clampedLayout}
							onLayoutChange={(next) => setLayout(next)}
							onRemoveInstrument={onRemoveInstrument}
							view={view}
							setView={setViewClamped}
							onViewportSizeChange={setViewportSize}
							onCenterInstrument={onCenterInstrument}
							onContextMenu={(e) => {
								e.preventDefault();
								setCtxMenu({ x: e.clientX, y: e.clientY });
							}}
						/>
					</main>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					className="hiddenFileInput"
					onChange={onFilePicked}
				/>

				{ctxMenu
					? createPortal(
							<div
								data-contextmenu-portal
								className="fixed z-[9999]"
								style={{ left: ctxMenu.x, top: ctxMenu.y }}
							>
								<div className="min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
									<button
										type="button"
										onClick={() => {
											setCtxMenu(null);
											onAddInstrumentClick();
										}}
										className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10 active:bg-white/15"
									>
										<span>Add instrument…</span>
										<span className="text-xs text-white/40">Ctrl+O</span>
									</button>
								</div>
							</div>,
							document.body,
						)
					: null}
			</div>
		);
}

export default App;
