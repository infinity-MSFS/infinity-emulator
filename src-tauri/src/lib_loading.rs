use libloading::Library;
use std::{
    ffi::{c_char, c_void, CStr, CString},
    path::PathBuf,
    sync::Mutex,
};

type FsContext = u32;
type ENUM = i32;

#[repr(C)]
pub struct GaugeHostApi {
    pub get_units_enum: extern "C" fn(*const c_char) -> ENUM,
    pub get_aircraft_var_enum: extern "C" fn(*const c_char) -> ENUM,
    pub aircraft_varget: extern "C" fn(ENUM, ENUM, i32) -> f64,
    pub resolve_asset_path: extern "C" fn(*const c_char) -> *const c_char,
}

#[repr(C)]
pub struct sGaugeInstallData {
    pub iSizeX: i32,
    pub iSizeY: i32,
}

#[repr(C)]
pub struct sGaugeDrawData {
    pub winWidth: i32,
    pub winHeight: i32,
    pub fbWidth: i32,
    pub fbHeight: i32,
    pub framebuffer: *mut c_void,
}

type GaugeSetHostApi = unsafe extern "C" fn(*const GaugeHostApi);
type GaugeInit = unsafe extern "C" fn(FsContext, *mut sGaugeInstallData) -> bool;
type GaugeDraw = unsafe extern "C" fn(FsContext, *const sGaugeDrawData) -> bool;
type GaugeKill = unsafe extern "C" fn(FsContext) -> bool;

extern "C" fn get_units_enum(_name: *const c_char) -> ENUM { 0 }
extern "C" fn get_aircraft_var_enum(_name: *const c_char) -> ENUM { 0 }

extern "C" fn aircraft_varget(_var: ENUM, _units: ENUM, _index: i32) -> f64 { 0.0 }
static mut PATH_BUF: Option<CString> = None;
extern "C" fn resolve_asset_path(rel: *const c_char) -> *const c_char {
    unsafe {
        let rel = if rel.is_null() { "" } else { CStr::from_ptr(rel).to_str().unwrap_or("") };
        PATH_BUF = Some(CString::new(rel).unwrap());
        PATH_BUF.as_ref().unwrap().as_ptr()
    }
}


pub struct LoadedGauge {
    _lib: Library, 
    _api: Box<GaugeHostApi>, 
    pub set_api: GaugeSetHostApi,
    pub init: GaugeInit,
    pub draw: GaugeDraw,
    pub kill: GaugeKill,
}

impl LoadedGauge {
    pub unsafe fn load(path: PathBuf) -> anyhow::Result<Self> {
        #[cfg(windows)]
        {
            use std::os::windows::ffi::OsStrExt;
            use std::ffi::OsStr;

            let dir = path.parent().unwrap_or_else(|| std::path::Path::new("."));
            let wide: Vec<u16> = OsStr::new(dir)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            extern "system" {
                fn SetDllDirectoryW(lpPathName: *const u16) -> i32;
            }

            let _ = SetDllDirectoryW(wide.as_ptr());
        }

        let lib = Library::new(path)?;

        let set_api: GaugeSetHostApi = *lib.get::<GaugeSetHostApi>(b"Gauge_SetHostApi")?;
        let init: GaugeInit = *lib.get::<GaugeInit>(b"Attitude_gauge_init")?;
        let draw: GaugeDraw = *lib.get::<GaugeDraw>(b"Attitude_gauge_draw")?;
        let kill: GaugeKill = *lib.get::<GaugeKill>(b"Attitude_gauge_kill")?;

        let api = Box::new(GaugeHostApi {
            get_units_enum,
            get_aircraft_var_enum,
            aircraft_varget,
            resolve_asset_path,
        });
        (set_api)(&*api as *const _);

        Ok(Self { _lib: lib, _api: api, set_api, init, draw, kill })
    }
}

pub struct GaugeRuntime {
    gauge: LoadedGauge,
    ctx: FsContext,
    rgba: Vec<u8>,
    fbw: i32,
    fbh: i32,
}

impl GaugeRuntime {
    pub unsafe fn new(gauge: LoadedGauge, win_w: i32, win_h: i32, dpr: f32) -> anyhow::Result<Self> {
        let ctx: FsContext = 0;

        let mut install = sGaugeInstallData { iSizeX: win_w, iSizeY: win_h };
        if !(gauge.init)(ctx, &mut install) {
            anyhow::bail!("gauge init failed");
        }

        let fbw = (win_w as f32 * dpr).round() as i32;
        let fbh = (win_h as f32 * dpr).round() as i32;
        let rgba = vec![0u8; (fbw * fbh * 4) as usize];

        Ok(Self { gauge, ctx, rgba, fbw, fbh })
    }

    pub unsafe fn render(&mut self, win_w: i32, win_h: i32, dpr: f32) -> (&[u8], i32, i32) {
        let fbw = (win_w as f32 * dpr).round() as i32;
        let fbh = (win_h as f32 * dpr).round() as i32;

        if fbw != self.fbw || fbh != self.fbh {
            self.fbw = fbw;
            self.fbh = fbh;
            self.rgba.resize((fbw * fbh * 4) as usize, 0);
        }

        let mut draw = sGaugeDrawData {
            winWidth: win_w,
            winHeight: win_h,
            fbWidth: fbw,
            fbHeight: fbh,
            framebuffer: self.rgba.as_mut_ptr() as *mut c_void,
        };

        let _ok = (self.gauge.draw)(self.ctx, &mut draw);
        (&self.rgba, fbw, fbh)
    }
}

pub struct AppState {
    pub gauge: Mutex<GaugeRuntime>,
}