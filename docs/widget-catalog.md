# Widget Catalog

A comprehensive reference for all 50+ pure-Python UI components available in `pdwidgets`.

---

## 💻 Live Multi-Widget Playground

Interact with buttons, sliders, progress bars, and switches live in your browser:

<div class="pydevices-live-demo">
  <div class="demo-editor-pane">
    <textarea class="code-editor">
import appdev
import pdwidgets as pd
from displaydev.psdisplay import PSDisplay

display_drv = PSDisplay(CANVAS_ID, width=320, height=240)
app = appdev.App(display_drv)
display = pd.Display(display_drv, app)
screen = pd.Screen(display, bg=0x18C3)

# 1. Card Container
card = pd.Card(screen, x=10, y=10, w=300, h=220, bg=0x2124, radius=8)
pd.Label(card, value="Component Showcase", x=16, y=12)

# 2. Progress Bar & Slider
progress = pd.ProgressBar(card, value=40, max_val=100, x=16, y=42, w=268, h=14)
slider = pd.Slider(card, value=40, min_val=0, max_val=100, x=16, y=70, w=268, h=20)

def on_slide(w):
    progress.value = w.value
slider.set_change_cb(on_slide)

# 3. Switch & Status
status = pd.Label(card, value="Switch is OFF", x=80, y=110)
sw = pd.Switch(card, value=False, x=16, y=105)

def on_switch(w):
    status.value = f"Switch is {'ON' if w.value else 'OFF'}"
sw.set_change_cb(on_switch)

# 4. Buttons
btn = pd.Button(card, label="Increment", x=16, y=150, w=120, h=36, radius=4)
def on_btn(s, e):
    slider.value = min(100, slider.value + 10)
    progress.value = slider.value
btn.add_event_cb(pd.events.MOUSEBUTTONUP, on_btn)

app.run()
    </textarea>
    <div class="demo-controls">
      <button class="run-btn" disabled>▶ Run</button>
      <button class="reset-btn">↺ Reset</button>
      <span class="demo-status">Initializing Python…</span>
    </div>
    <pre class="demo-output"></pre>
  </div>
  <div class="demo-canvas-pane">
    <canvas id="canvas_widget_catalog" width="320" height="240" tabindex="0"></canvas>
  </div>
</div>

---

## 1. Basic Controls & Badges

| Widget | Module | Description |
|:---|:---|:---|
| **`Button`** | `pdwidgets.widgets.button` | Clickable push button with label, hover states, and corner radius |
| **`IconButton`** | `pdwidgets.widgets.icon_button` | Compact button containing an icon glyph |
| **`ToggleButton`** | `pdwidgets.widgets.toggle_button` | Latching push button that maintains on/off state |
| **`Badge`** | `pdwidgets.widgets.badge` | Small pill/circular badge for counts and status tags |
| **`Chip`** | `pdwidgets.widgets.chip` | Compact rounded action or filter tag |
| **`Divider`** | `pdwidgets.widgets.divider` | Clean horizontal or vertical separation line |

```python
btn = pd.Button(parent, label="Submit", x=10, y=10, w=100, h=36, radius=4)
badge = pd.Badge(parent, value="NEW", x=120, y=10, bg=0xF800)
```

---

## 2. Text & Input Controls

| Widget | Module | Description |
|:---|:---|:---|
| **`Label`** | `pdwidgets.widgets.label` | Formatted single-line text label (`value=`) |
| **`TextBox`** | `pdwidgets.widgets.text_box` | Multi-line wrapped text box |
| **`TextInput`** | `pdwidgets.widgets.text_input` | Editable single-line text input field |
| **`PasswordField`** | `pdwidgets.widgets.password_field` | Masked PIN / password entry field |
| **`NumberStepper`** | `pdwidgets.widgets.number_stepper` | Increment / decrement counter with +/- buttons |

```python
label = pd.Label(parent, value="Sensor: 24.5 C", x=10, y=10)
stepper = pd.NumberStepper(parent, value=1, min_val=0, max_val=10, x=10, y=40)
```

---

## 3. Selection & Toggles

| Widget | Module | Description |
|:---|:---|:---|
| **`Switch`** | `pdwidgets.widgets.switch` | Modern sliding toggle switch |
| **`CheckBox`** | `pdwidgets.widgets.check_box` | Standard checkbox with label |
| **`RadioButton`** | `pdwidgets.widgets.radio_button` | Circular radio button |
| **`RadioGroup`** | `pdwidgets.widgets.radio_group` | Manages mutually exclusive radio options |
| **`SegmentedControl`** | `pdwidgets.widgets.segmented_control` | Multi-segment horizontal button bar |
| **`Dropdown`** | `pdwidgets.widgets.dropdown` | Popup selection menu with scrollable items |

```python
switch = pd.Switch(parent, value=True, x=10, y=10)
segments = pd.SegmentedControl(parent, options=["Day", "Week", "Month"], x=10, y=50)
```

---

## 4. Layout Containers

| Container | Module | Description |
|:---|:---|:---|
| **`Card`** | `pdwidgets.widgets.card` | Elevated rounded container with border and background fill |
| **`Row`** | `pdwidgets.widgets.row` | Horizontal flex layout container |
| **`Column`** | `pdwidgets.widgets.column` | Vertical flex layout container |
| **`Grid`** | `pdwidgets.widgets.grid` | 2D tabular auto-aligning container |
| **`ScrollView`** | `pdwidgets.widgets.scroll_view` | Scrollable viewport supporting drag and touch inertia |
| **`Accordion`** | `pdwidgets.widgets.accordion` | Expandable/collapsible content drawers |
| **`TabView`** | `pdwidgets.widgets.tab_view` | Multi-tab container with navigation bar |

```python
card = pd.Card(screen, x=10, y=10, w=200, h=150, radius=6)
col = pd.Column(card, gap=8, align=pd.ALIGN.CENTER)
```

---

## 5. Navigation & Chrome

| Component | Module | Description |
|:---|:---|:---|
| **`AppBar`** | `pdwidgets.widgets.app_bar` | Top title bar with navigation and action icons |
| **`Drawer`** | `pdwidgets.widgets.drawer` | Slide-out navigation drawer |
| **`BottomSheet`** | `pdwidgets.widgets.bottom_sheet` | Modal sheet sliding up from the bottom |
| **`Menu`** | `pdwidgets.widgets.menu` | Context or popup menu |
| **`Navigator`** | `pdwidgets.widgets.navigator` | Page transition controller with back-stack |

---

## 6. Feedback & Overlays

| Component | Module | Description |
|:---|:---|:---|
| **`Dialog`** | `pdwidgets.widgets.dialog` | Modal dialog box with title, message, and action buttons |
| **`Toast`** | `pdwidgets.widgets.toast` | Temporary auto-dismissing notification banner |
| **`ProgressBar`** | `pdwidgets.widgets.progress_bar` | Horizontal progress indicator |
| **`Spinner`** | `pdwidgets.widgets.spinner` | Animated circular waiting spinner |

```python
dialog = pd.Dialog(screen, title="Confirm", message="Save changes?", buttons=["Cancel", "OK"])
```

---

## 7. Specialized Widgets & Pickers

| Component | Module | Description |
|:---|:---|:---|
| **`Chart`** | `pdwidgets.widgets.chart` | Sparkline, bar, and area telemetry chart |
| **`Gauge`** | `pdwidgets.widgets.gauge` | Circular dial meter with needle / arc fill |
| **`DigitalClock`** | `pdwidgets.widgets.digital_clock` | Real-time digital clock display |
| **`DatePicker`** | `pdwidgets.widgets.date_picker` | Calendar month / day picker |
| **`ColorPicker`** | `pdwidgets.widgets.color_picker` | Interactive RGB565 / palette color selector |
| **`Keyboard`** | `pdwidgets.widgets.keyboard` | On-screen QWERTY virtual keyboard |
| **`PinPad`** | `pdwidgets.widgets.pin_pad` | Numeric 0–9 keypad for PIN entry |
| **`ListView`** | `pdwidgets.widgets.list_view` | High-performance virtualized list |
