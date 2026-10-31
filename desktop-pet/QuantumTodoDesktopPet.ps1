$ErrorActionPreference = "Stop"

$mutexCreated = $false
$petMutex = [System.Threading.Mutex]::new($true, "Local\QuantumTodoDesktopPet", [ref]$mutexCreated)
if (-not $mutexCreated) { exit 0 }
$stopEventCreated = $false
$stopEvent = [System.Threading.EventWaitHandle]::new($false, [System.Threading.EventResetMode]::AutoReset, "Local\QuantumTodoDesktopPet.Stop", [ref]$stopEventCreated)

Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.Web.Extensions
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

public sealed class QuantumTodoDesktopTask
{
    public string id { get; set; }
    public long createdAt { get; set; }
}

public sealed class QuantumTodoDesktopSnapshot
{
    public long updatedAt { get; set; }
    public QuantumTodoDesktopTask[] tasks { get; set; }
}

public sealed class QuantumTodoDesktopPetForm : Form
{
    private const int WmHotKey = 0x0312;
    private const int HotKeyId = 0x5143;
    private const int WsExTransparent = 0x00000020;
    private const int WsExToolWindow = 0x00000080;
    private const int WsExLayered = 0x00080000;
    private const int WsExNoActivate = 0x08000000;
    private const float DefaultScale = 1.45f;
    private readonly EventWaitHandle stopEvent;
    private readonly System.Windows.Forms.Timer animationTimer;
    private readonly JavaScriptSerializer serializer = new JavaScriptSerializer();
    private readonly string snapshotPath = Path.Combine(Path.GetTempPath(), "quantum-todo-desktop-tasks.json");
    private readonly System.Diagnostics.Stopwatch clock = System.Diagnostics.Stopwatch.StartNew();
    private List<QuantumTodoDesktopTask> tasks = new List<QuantumTodoDesktopTask>();
    private double runnerX;
    private double frameElapsed;
    private DateTime lastSnapshotCheckUtc = DateTime.MinValue;
    private string lastSnapshotJson;
    private int direction = 1;
    private bool alternatePose;
    private bool sparkleVisible = true;
    private bool registeredHotKey;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint modifiers, uint key);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    public QuantumTodoDesktopPetForm(EventWaitHandle stopSignal)
    {
        stopEvent = stopSignal;
        Text = "Quantum Todo Desktop Pet";
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.Manual;
        BackColor = Color.Magenta;
        TransparencyKey = Color.Magenta;
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);

        Rectangle workArea = Screen.PrimaryScreen.WorkingArea;
        Bounds = new Rectangle(workArea.Left, workArea.Bottom - 82, workArea.Width, 82);

        animationTimer = new System.Windows.Forms.Timer { Interval = 16 };
        animationTimer.Tick += OnAnimationTick;
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams parameters = base.CreateParams;
            parameters.ExStyle |= WsExTransparent | WsExToolWindow | WsExLayered | WsExNoActivate;
            return parameters;
        }
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        registeredHotKey = RegisterHotKey(Handle, HotKeyId, 0x0002 | 0x0004, (uint)Keys.Q);
        clock.Restart();
        animationTimer.Start();
    }

    protected override void WndProc(ref Message message)
    {
        if (message.Msg == WmHotKey && message.WParam.ToInt32() == HotKeyId)
        {
            Close();
            return;
        }
        base.WndProc(ref message);
    }

    private void OnAnimationTick(object sender, EventArgs e)
    {
        if (stopEvent.WaitOne(0)) { Close(); return; }
        RefreshTasks();

        double elapsed = Math.Min(clock.Elapsed.TotalSeconds, 0.05);
        clock.Restart();
        int count = tasks.Count;
        if (count > 0)
        {
            float gap = count <= 1 ? 0 : Math.Max(0.5f, Math.Min(8f, (float)ClientSize.Width / count * 0.12f));
            float scale = Math.Min(DefaultScale, Math.Max(0.035f, (ClientSize.Width - gap * (count - 1)) / (48f * count)));
            float petWidth = 48f * scale;
            float step = petWidth + gap;
            double maxX = Math.Max(0, ClientSize.Width - (petWidth + (count - 1) * step));
            runnerX += direction * 155 * elapsed;
            if (runnerX >= maxX) { runnerX = maxX; direction = -1; }
            if (runnerX <= 0) { runnerX = 0; direction = 1; }

            frameElapsed += elapsed;
            if (frameElapsed >= 0.13)
            {
                frameElapsed = 0;
                alternatePose = !alternatePose;
                sparkleVisible = !sparkleVisible;
            }
        }
        else { runnerX = 0; }
        Invalidate();
    }

    private void RefreshTasks()
    {
        if ((DateTime.UtcNow - lastSnapshotCheckUtc).TotalMilliseconds < 400) return;
        lastSnapshotCheckUtc = DateTime.UtcNow;
        try
        {
            if (!File.Exists(snapshotPath))
            {
                tasks = new List<QuantumTodoDesktopTask>();
                lastSnapshotJson = null;
                return;
            }

            string json = File.ReadAllText(snapshotPath);
            if (String.Equals(json, lastSnapshotJson, StringComparison.Ordinal)) return;
            QuantumTodoDesktopSnapshot snapshot = serializer.Deserialize<QuantumTodoDesktopSnapshot>(json);
            if (snapshot == null || snapshot.tasks == null) return;
            tasks = new List<QuantumTodoDesktopTask>();
            foreach (QuantumTodoDesktopTask task in snapshot.tasks)
            {
                if (task != null && !String.IsNullOrWhiteSpace(task.id) && task.createdAt > 0) tasks.Add(task);
            }
            lastSnapshotJson = json;
        }
        catch
        {
            // Keep the last good snapshot if the file is briefly unavailable during an atomic update.
        }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics graphics = e.Graphics;
        graphics.Clear(TransparencyKey);
        graphics.SmoothingMode = SmoothingMode.None;
        graphics.PixelOffsetMode = PixelOffsetMode.None;

        int count = tasks.Count;
        if (count == 0) return;
        float gap = count <= 1 ? 0 : Math.Max(0.5f, Math.Min(8f, (float)ClientSize.Width / count * 0.12f));
        float scale = Math.Min(DefaultScale, Math.Max(0.035f, (ClientSize.Width - gap * (count - 1)) / (48f * count)));
        float stride = 48f * scale + gap;
        for (int index = 0; index < count; index++)
        {
            DrawCreature(graphics, tasks[index], (float)runnerX + index * stride, scale);
        }
    }

    private void DrawCreature(Graphics graphics, QuantumTodoDesktopTask task, float x, float scale)
    {
        long age = Math.Max(0, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - task.createdAt);
        int stage = age >= 7L * 86400000 ? 2 : age >= 3L * 86400000 ? 1 : 0;
        float y = Math.Max(1, 72f - 41f * scale) + (alternatePose ? -1.2f : 0f);
        float shadowWidth = 28f * scale;
        float shadowX = (48f * scale - shadowWidth) / 2f;
        DrawPixel(graphics, shadowX / scale, 46, shadowWidth / scale, 2, Color.FromArgb(45, 57, 50), x, scale, 0);

        if (stage == 0) DrawFresh(graphics, x, y, scale);
        else if (stage == 1) DrawMutant(graphics, x, y, scale);
        else DrawBoss(graphics, x, y, scale);
    }

    private void DrawFresh(Graphics g, float x, float y, float s)
    {
        DrawPixel(g, 5, alternatePose ? 21 : 18, 8, 3, Color.FromArgb(255, 181, 111), x, s, y);
        DrawPixel(g, 2, alternatePose ? 24 : 21, 7, 3, Color.FromArgb(255, 143, 124), x, s, y);
        DrawPixel(g, 13, 23, 8, 5, Color.FromArgb(213, 155, 113), x, s, y);
        DrawPixel(g, 27, 23, 8, 5, Color.FromArgb(213, 155, 113), x, s, y);
        DrawLegs(g, x, y, s);
        DrawPixel(g, 14, 10, 22, 13, Color.FromArgb(112, 79, 140), x, s, y);
        DrawPixel(g, 11, 13, 28, 8, Color.FromArgb(157, 121, 188), x, s, y);
        DrawEyes(g, x, y, s, Color.FromArgb(255, 240, 207), Color.FromArgb(40, 49, 61));
        DrawPixel(g, 20, 23, 12, 9, Color.FromArgb(143, 226, 192), x, s, y);
        DrawPixel(g, 17, 27, 18, 7, Color.FromArgb(106, 199, 158), x, s, y);
        DrawPixel(g, 18, 6, 7, 5, Color.FromArgb(93, 191, 147), x, s, y);
        DrawPixel(g, 29, 6, 7, 5, Color.FromArgb(93, 191, 147), x, s, y);
        if (sparkleVisible) DrawPixel(g, 40, 11, 3, 3, Color.FromArgb(249, 210, 126), x, s, y);
    }

    private void DrawMutant(Graphics g, float x, float y, float s)
    {
        DrawPixel(g, 4, 18, 9, 5, Color.FromArgb(244, 147, 108), x, s, y);
        DrawPixel(g, 1, 22, 8, 5, Color.FromArgb(224, 112, 103), x, s, y);
        DrawPixel(g, 35, 22, 9, 5, Color.FromArgb(224, 112, 103), x, s, y);
        DrawLegs(g, x, y, s);
        DrawPixel(g, 12, 10, 24, 14, Color.FromArgb(88, 57, 111), x, s, y);
        DrawPixel(g, 9, 15, 30, 9, Color.FromArgb(133, 82, 142), x, s, y);
        DrawPixel(g, 13, 7, 6, 8, Color.FromArgb(255, 128, 105), x, s, y);
        DrawPixel(g, 29, 7, 6, 8, Color.FromArgb(255, 128, 105), x, s, y);
        DrawPixel(g, 14, 4, 4, 5, Color.FromArgb(255, 208, 139), x, s, y);
        DrawPixel(g, 30, 4, 4, 5, Color.FromArgb(255, 208, 139), x, s, y);
        DrawEyes(g, x, y, s, Color.FromArgb(255, 224, 162), Color.FromArgb(85, 40, 49));
        DrawPixel(g, 18, 23, 12, 8, Color.FromArgb(244, 176, 93), x, s, y);
        DrawPixel(g, 15, 27, 18, 8, Color.FromArgb(218, 132, 81), x, s, y);
        DrawPixel(g, 21, 32, 7, 3, Color.FromArgb(255, 232, 188), x, s, y);
        DrawPixel(g, 13, 25, 4, 5, Color.FromArgb(255, 128, 105), x, s, y);
        DrawPixel(g, 32, 25, 4, 5, Color.FromArgb(255, 128, 105), x, s, y);
        if (sparkleVisible) DrawPixel(g, 41, 11, 3, 3, Color.FromArgb(255, 208, 114), x, s, y);
    }

    private void DrawBoss(Graphics g, float x, float y, float s)
    {
        DrawPixel(g, 2, 22, 11, 8, Color.FromArgb(134, 52, 79), x, s, y);
        DrawPixel(g, 0, 26, 9, 8, Color.FromArgb(191, 73, 91), x, s, y);
        DrawPixel(g, 35, 22, 11, 8, Color.FromArgb(134, 52, 79), x, s, y);
        DrawPixel(g, 39, 26, 9, 8, Color.FromArgb(191, 73, 91), x, s, y);
        DrawLegs(g, x, y, s);
        DrawPixel(g, 12, 11, 24, 13, Color.FromArgb(72, 42, 82), x, s, y);
        DrawPixel(g, 8, 16, 32, 9, Color.FromArgb(117, 48, 83), x, s, y);
        DrawPixel(g, 8, 8, 8, 11, Color.FromArgb(191, 65, 83), x, s, y);
        DrawPixel(g, 32, 8, 8, 11, Color.FromArgb(191, 65, 83), x, s, y);
        DrawPixel(g, 7, 4, 6, 6, Color.FromArgb(255, 166, 106), x, s, y);
        DrawPixel(g, 35, 4, 6, 6, Color.FromArgb(255, 166, 106), x, s, y);
        DrawPixel(g, 13, 4, 6, 7, Color.FromArgb(191, 65, 83), x, s, y);
        DrawPixel(g, 29, 4, 6, 7, Color.FromArgb(191, 65, 83), x, s, y);
        DrawEyes(g, x, y, s, Color.FromArgb(255, 211, 119), Color.FromArgb(66, 32, 52));
        DrawPixel(g, 16, 23, 16, 11, Color.FromArgb(191, 79, 91), x, s, y);
        DrawPixel(g, 12, 27, 24, 9, Color.FromArgb(148, 55, 81), x, s, y);
        DrawPixel(g, 19, 33, 10, 3, Color.FromArgb(255, 219, 163), x, s, y);
        DrawPixel(g, 13, 28, 4, 7, Color.FromArgb(238, 112, 103), x, s, y);
        DrawPixel(g, 31, 28, 4, 7, Color.FromArgb(238, 112, 103), x, s, y);
        if (sparkleVisible) DrawPixel(g, 42, 12, 3, 3, Color.FromArgb(255, 222, 120), x, s, y);
    }

    private void DrawLegs(Graphics g, float x, float y, float s)
    {
        if (!alternatePose)
        {
            DrawPixel(g, 16, 28, 6, 8, Color.FromArgb(57, 94, 84), x, s, y);
            DrawPixel(g, 27, 28, 6, 7, Color.FromArgb(57, 94, 84), x, s, y);
            DrawPixel(g, 17, 35, 7, 4, Color.FromArgb(38, 58, 53), x, s, y);
            DrawPixel(g, 28, 34, 6, 4, Color.FromArgb(38, 58, 53), x, s, y);
            DrawPixel(g, 21, 37, 10, 4, Color.FromArgb(142, 224, 182), x, s, y);
            DrawPixel(g, 31, 37, 9, 4, Color.FromArgb(142, 224, 182), x, s, y);
        }
        else
        {
            DrawPixel(g, 15, 28, 6, 7, Color.FromArgb(57, 94, 84), x, s, y);
            DrawPixel(g, 29, 28, 6, 8, Color.FromArgb(57, 94, 84), x, s, y);
            DrawPixel(g, 10, 34, 7, 4, Color.FromArgb(38, 58, 53), x, s, y);
            DrawPixel(g, 29, 35, 7, 4, Color.FromArgb(38, 58, 53), x, s, y);
            DrawPixel(g, 4, 37, 10, 4, Color.FromArgb(142, 224, 182), x, s, y);
            DrawPixel(g, 27, 37, 10, 4, Color.FromArgb(142, 224, 182), x, s, y);
        }
    }

    private void DrawEyes(Graphics g, float x, float y, float s, Color white, Color pupil)
    {
        DrawPixel(g, 17, 16, 5, 5, white, x, s, y);
        DrawPixel(g, 29, 16, 5, 5, white, x, s, y);
        DrawPixel(g, 19, 18, 2, 3, pupil, x, s, y);
        DrawPixel(g, 30, 18, 2, 3, pupil, x, s, y);
    }

    private void DrawPixel(Graphics graphics, float px, float py, float width, float height, Color color, float originX, float scale, float originY)
    {
        float mirroredX = direction < 0 ? 48f - px - width : px;
        RectangleF rectangle = new RectangleF(originX + mirroredX * scale, originY + py * scale, width * scale, height * scale);
        using (Brush brush = new SolidBrush(color)) graphics.FillRectangle(brush, rectangle);
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        animationTimer.Stop();
        if (registeredHotKey) UnregisterHotKey(Handle, HotKeyId);
        stopEvent.Dispose();
        base.OnFormClosed(e);
    }
}
'@ -ReferencedAssemblies @('System.Windows.Forms', 'System.Drawing', 'System.Web.Extensions')

try {
    [System.Windows.Forms.Application]::EnableVisualStyles()
    $form = [QuantumTodoDesktopPetForm]::new($stopEvent)
    [System.Windows.Forms.Application]::Run($form)
} finally {
    $petMutex.ReleaseMutex()
    $petMutex.Dispose()
}
