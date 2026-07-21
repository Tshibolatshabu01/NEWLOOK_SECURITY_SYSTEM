/*=====================================================
RESET
=====================================================*/

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:"Segoe UI",sans-serif;
}

html,
body{

    width:100%;
    height:100%;
    overflow:hidden;

    background:#000;

}

.attendance-app{

    position:relative;

    width:100vw;
    height:100vh;

    overflow:hidden;

}


/*=====================================================
FULL SCREEN CAMERA
=====================================================*/

#attendanceVideo{

    position:absolute;

    inset:0;

    width:100%;
    height:100%;

    object-fit:cover;

    background:#000;

    z-index:1;

}

#attendanceCanvas{

    position:absolute;

    inset:0;

    width:100%;
    height:100%;

    z-index:2;

    pointer-events:none;

}


/*=====================================================
DARK OVERLAY
=====================================================*/

.camera-overlay{

    position:absolute;

    inset:0;

    background:

    linear-gradient(

        rgba(0,0,0,.35),

        rgba(0,0,0,.55)

    );

    z-index:3;

}


/*=====================================================
TOP BAR
=====================================================*/

.top-bar{

    position:absolute;

    top:0;

    left:0;

    right:0;

    z-index:10;

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:30px 40px;

    background:

    linear-gradient(

        rgba(0,0,0,.65),

        transparent

    );

}

.logo h1{

    color:#fff;

    font-size:40px;

    font-weight:800;

    letter-spacing:2px;

}

.logo span{

    color:#3fa9ff;

    font-size:15px;

}

.live-clock{

    text-align:right;

}

.live-clock h2{

    color:#fff;

    font-size:38px;

    font-weight:700;

}

.live-clock p{

    color:#d1d5db;

    margin-top:5px;

}


/*=====================================================
SCANNER
=====================================================*/

.scanner-area{

    position:absolute;

    top:50%;

    left:50%;

    transform:translate(-50%,-50%);

    z-index:10;

}

.scanner-frame{

    width:420px;

    height:520px;

    border:5px solid #38bdf8;

    border-radius:30px;

    position:relative;

    overflow:hidden;

    box-shadow:

        0 0 40px rgba(56,189,248,.45);

}

.scanner-line{

    position:absolute;

    left:0;

    width:100%;

    height:4px;

    background:#38bdf8;

    animation:scan 2.5s linear infinite;

}

@keyframes scan{

    0%{

        top:0;

    }

    100%{

        top:100%;

    }

}


/*=====================================================
STATUS PANEL
=====================================================*/

.status-panel{

    position:absolute;

    left:50%;

    bottom:25px;

    transform:translateX(-50%);

    width:95%;

    max-width:1500px;

    background:

    rgba(15,23,42,.82);

    backdrop-filter:blur(18px);

    border-radius:25px;

    padding:30px;

    z-index:15;

    border:1px solid rgba(255,255,255,.15);

}

.status-header{

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-bottom:25px;

}

.status-header h2{

    color:#fff;

    font-size:28px;

}

#attendanceStatus{

    padding:12px 25px;

    border-radius:40px;

    font-weight:700;

    font-size:15px;

}

.waiting{

    background:#334155;

    color:#fff;

}

.success{

    background:#16a34a;

    color:#fff;

}

.error{

    background:#dc2626;

    color:#fff;

}


/*=====================================================
EMPLOYEE GRID
=====================================================*/

.employee-grid{

    display:grid;

    grid-template-columns:repeat(6,1fr);

    gap:20px;

}

.info-card{

    background:rgba(255,255,255,.06);

    border-radius:18px;

    padding:18px;

}

.info-card label{

    display:block;

    color:#94a3b8;

    font-size:13px;

    margin-bottom:10px;

}

.info-card span{

    color:#fff;

    font-size:18px;

    font-weight:700;

}


/*=====================================================
MOBILE
=====================================================*/

/*=====================================================
PHONE & TABLET
SAME LAYOUT - FIT SCREEN
=====================================================*/

@media (max-width:1024px){

    .top-bar{
        padding:18px 20px;
    }

    .logo h1{
        font-size:28px;
    }

    .logo span{
        font-size:13px;
    }

    .live-clock h2{
        font-size:26px;
    }

    .live-clock p{
        font-size:13px;
    }

    .scanner-frame{
        width:300px;
        height:380px;
    }

    .status-panel{
        width:98%;
        padding:18px;
        bottom:15px;
    }

    .status-header h2{
        font-size:22px;
    }

    #attendanceStatus{
        padding:10px 18px;
        font-size:13px;
    }

    /* KEEP 6 COLUMNS */
    .employee-grid{
        grid-template-columns:repeat(6,1fr);
        gap:10px;
    }

    .info-card{
        padding:12px;
    }

    .info-card label{
        font-size:11px;
    }

    .info-card span{
        font-size:14px;
    }

}

@media (max-width:768px){

    /* KEEP HEADER HORIZONTAL */
    .top-bar{
        flex-direction:row;
        justify-content:space-between;
        align-items:center;
        padding:15px;
    }

    .logo h1{
        font-size:22px;
    }

    .logo span{
        font-size:11px;
    }

    .live-clock{
        text-align:right;
    }

    .live-clock h2{
        font-size:20px;
    }

    .live-clock p{
        font-size:11px;
    }

    .scanner-frame{
        width:220px;
        height:280px;
    }

    .status-panel{
        width:98%;
        padding:12px;
        bottom:10px;
    }

    .status-header{
        flex-direction:row;
        justify-content:space-between;
        align-items:center;
        margin-bottom:12px;
    }

    .status-header h2{
        font-size:18px;
    }

    #attendanceStatus{
        font-size:12px;
        padding:8px 14px;
    }

    /* KEEP 6 COLUMNS */
    .employee-grid{
        grid-template-columns:repeat(6,1fr);
        gap:8px;
    }

    .info-card{
        padding:10px;
    }

    .info-card label{
        font-size:10px;
        margin-bottom:4px;
    }

    .info-card span{
        font-size:12px;
    }

}