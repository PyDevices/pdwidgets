# SPDX-FileCopyrightText: 2026 Brad Barnett
# SPDX-License-Identifier: MIT
"""Widget text/radius aliases, remove/clear, and event callback order."""

import unittest
from types import SimpleNamespace

from eventsys import events
from pdwidgets.widget import Widget


class _Root(Widget):
    """Parentless container with Display-like visibility."""

    @property
    def visible(self):
        return self._visible

    @property
    def display(self):
        return self._display


class TestWidgetApi(unittest.TestCase):
    def setUp(self):
        self.root = _Root(None, 0, 0, 100, 100, padding=(0, 0, 0, 0))
        self.root._display = SimpleNamespace(
            translate_point=lambda pos: pos,
        )

    def test_text_and_radius_kwargs(self):
        w = Widget(self.root, w=10, h=10, text="hi", radius=5)
        self.assertEqual(w.value, "hi")
        self.assertEqual(w.text, "hi")
        self.assertEqual(w.radius, 5)
        w.text = "yo"
        self.assertEqual(w.value, "yo")

    def test_text_and_value_conflict(self):
        with self.assertRaises(TypeError):
            Widget(self.root, w=10, h=10, value="a", text="b")

    def test_remove_and_clear(self):
        a = Widget(self.root, w=10, h=10)
        b = Widget(self.root, w=10, h=10)
        self.assertEqual(self.root.children, [a, b])
        a.remove()
        self.assertIsNone(a.parent)
        self.assertEqual(self.root.children, [b])
        self.root.clear()
        self.assertEqual(self.root.children, [])
        self.assertIsNone(b.parent)

    def test_callback_order_data_then_event(self):
        child = Widget(self.root, w=10, h=10)
        seen = []

        def cb(data, event):
            seen.append((data, event))

        child.add_event_cb(events.MOUSEBUTTONDOWN, cb)
        event = SimpleNamespace(type=events.MOUSEBUTTONDOWN, pos=(0, 0))
        self.root.handle_event(event, condition=lambda c, e, p: True, point=(0, 0))
        self.assertEqual(len(seen), 1)
        self.assertIs(seen[0][0], child)
        self.assertIs(seen[0][1], event)


if __name__ == "__main__":
    unittest.main()
