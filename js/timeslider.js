/*!
 * Timeslider v0.5.0
 * Copyright 2016 Valery Vishnevskiy
 * https://github.com/v-v-vishnevskiy/timeslider
 * https://github.com/v-v-vishnevskiy/timeslider/blob/master/LICENSE
 */

if (typeof jQuery === 'undefined') {
    throw new Error('Timeslider\'s JavaScript requires jQuery')
}

(function ($) {
    'use strict';
    var version = $.fn.jquery.split(' ')[0].split('.');
    if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1)) {
        throw new Error('Timeslider\'s JavaScript requires jQuery version 1.9.1 or higher');
    }
}(jQuery));

(function ($) {
    var TimeSlider = function(element, options) {
        this.$element = null;
        this.options = null;
        this.init_timestamp = new Date();
        this.start_timestamp = 0;
        this.frozen_current_timestamp = 0;
        this.current_timestamp = 0;
        this.px_per_ms = 1;
        this.is_mouse_down_left = false;
        this.prev_cursor_x = 0;
        this.time_cell_selected = null;
        this.left_point_selected = null;
        this.right_point_selected = null;
        this.running_time_cell = null;
        this.time_caret = null;

        this.init(element, options);
    };

    TimeSlider.VERSION = '0.5.0';

    TimeSlider.DEFAULTS = {
        start_timestamp: (new Date()).getTime(),
        current_timestamp: (new Date()).getTime(),
        hours_per_frame: 24,
        update_timestamp_interval: 1000,
        update_interval: 1000,
        show_ms: false,
        init_cells: null,
        on_move_timeslider_callback: null,
        on_change_timeslider_callback: null,
        on_move_time_cell_callback: null,
        on_resize_time_cell_callback: null,
        on_change_time_cell_callback: null
    };

    TimeSlider.prototype.init = function(element, options) {
        this.$element = $(element);
        this.options = this.getOptions(options);

        if (this.$element.attr('start_timestamp')) {
            this.start_timestamp = parseInt(this.$element.attr('start_timestamp'));
        }
        if (this.$element.attr('current_timestamp')) {
            this.frozen_current_timestamp = this.current_timestamp = parseInt(this.$element.attr('current_timestamp'));
        }
        this.px_per_ms = this.$element.width() / (this.options['hours_per_frame'] * 3600 * 1000);

        // append background color
        this.$element.append('<div class="bg"></div><div class="bg-event"></div>');

        this.add_time_caret();
        this.add_graduations();
        if (this.options.init_cells) {
            if (typeof this.options.init_cells === 'function') {
                this.options.init_cells.bind(this).call();
            }
            else {
                this.add_cells(this.options.init_cells);
            }
        }
        this.add_events();
    };

    TimeSlider.prototype.getDefaults = function() {
        return TimeSlider.DEFAULTS;
    };

    TimeSlider.prototype.time_duration = function(ms) {
        var h = Math.floor(ms / (3600 * 1000));
        var m = Math.floor((ms - (h * (3600 * 1000))) / (60 * 1000));
        var s = Math.floor((ms - (h * (3600 * 1000)) - (m * (60 * 1000))) / 1000);
        var _ms = ms - (h * (3600 * 1000)) - (m * (60 * 1000)) - (s * 1000);
        if (this.options['show_ms']) {
            _ms = '.' + ('00' + _ms.toString()).substr(-3);
        }
        else {
            _ms = '';
        }
        if (h) {
            h = h.toString();
            m = m.toString();
            m = m.length > 1 ? m : '0' + m;
            s = s.toString();
            s = s.length > 1 ? s : '0' + s;
            return h + ':' + m + ':' + s + _ms;
        }
        else if (m) {
            m = m.toString();
            s = s.toString();
            s = s.length > 1 ? s : '0' + s  + _ms;
            return m + ':' + s;
        }
        return s.toString() + _ms;
    };

    TimeSlider.prototype.getOptions = function (options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options);

        // validations
        if (options['hours_per_frame'] < 1) {
            options['hours_per_frame'] = 1;
        }
        else if (options['hours_per_frame'] > 48) {
            options['hours_per_frame'] = 48;
        }

        if (options['update_timestamp_interval'] < 1) {
            options['update_timestamp_interval'] = 1;
        }

        if (options['update_interval'] < options['update_timestamp_interval']) {
            options['update_interval'] = options['update_timestamp_interval'];
        }

        if (options['start_timestamp'] && options['start_timestamp'] >= 0) {
            this.start_timestamp = options['start_timestamp'];
        }

        if (options['current_timestamp'] && options['current_timestamp'] >= 0) {
            this.frozen_current_timestamp = this.current_timestamp = options['current_timestamp'];
        }

        return options;
    };

    TimeSlider.prototype.date_to_str = function(datetime) {
        return ('0' + datetime.getUTCDate().toString()).substr(-2) + '.' +
            ('0' + (datetime.getUTCMonth() + 1).toString()).substr(-2) + '.' +
            datetime.getUTCFullYear() + ' ' +
            ('0' + datetime.getUTCHours().toString()).substr(-2) + ':' +
            ('0' + datetime.getUTCMinutes().toString()).substr(-2) + ':' +
            ('0' + datetime.getUTCSeconds().toString()).substr(-2) +
            (this.options['show_ms'] ? ('.' + ('00' + datetime.getUTCMilliseconds().toString()).substr(-3)) : '');
    };

    TimeSlider.prototype.graduation_title = function(datetime) {
        if (datetime.getUTCHours() == 0) {
            return ('0' + datetime.getUTCDate().toString()).substr(-2) + '.' +
                ('0' + (datetime.getUTCMonth() + 1).toString()).substr(-2) + '.' +
                datetime.getUTCFullYear();
        }
        return datetime.getUTCHours() + ':00';
    }

    TimeSlider.prototype.ms_to_next_hour = function(date) {
        var spent_ms = (date.getUTCMinutes() * 60 * 1000) + (date.getUTCSeconds() * 1000) + date.getUTCMilliseconds();
        return spent_ms ? (3600 * 1000) - spent_ms : 0;
    };

    TimeSlider.prototype.add_events = function() {
        window.setInterval(this.set_current_timestamp(), this.options['update_timestamp_interval']);
        window.setInterval(this.set_running_elements(), this.options['update_interval']);
        $('body').mouseup(this.mouse_up_event());
        $('body').mousemove(this.cursor_moving_event());
        this.$element.find('.bg-event').mousedown(this.timeslider_mouse_down_event());
    };

    TimeSlider.prototype.add_time_caret = function() {
        this.$element.append('<div class="time-caret"></div>');
        this.time_caret = this.$element.find('.time-caret');
        this.set_time_caret_position();
    };

    TimeSlider.prototype.add_graduations = function() {
        var ms_offset = this.ms_to_next_hour(new Date(this.start_timestamp));
        var hour_caret = this.start_timestamp + ms_offset - 3600 * 1000 * 4;
        var hour_step_px = this.$element.width() / this.options['hours_per_frame'];
        var date_hour_caret;
        var caret_class;
        var left;
        for (var i = -4; i <= this.options['hours_per_frame']; i++) {
            caret_class = '';
            date_hour_caret = new Date(hour_caret);
            if (date_hour_caret.getUTCHours() % 3 == 0) {
                caret_class = 'middle';
            }
            if (date_hour_caret.getUTCHours() == 0) {
                caret_class = 'big';
            }
            left = i * hour_step_px + this.px_per_ms * ms_offset;
            this.$element.append('<div id="hour' + i + '" class="each-hour-caret ' + caret_class + '" style="left: ' + left.toString() + 'px"></div>');
            this.$element.append(
                '<div id="datetime-hour' + i + '" class="datetime-caret' + (caret_class ? '' : ' hidden') + '" style="left:' + (left - 40).toString() + 'px">' +
                    this.graduation_title(date_hour_caret) +
                '</div>'
            );
            hour_caret += 3600 * 1000;
        }
    };

    TimeSlider.prototype.test = function() {
        console.log('test');
    };

    TimeSlider.prototype.add_cells = function(cells) {
        var _this = this;

        var time_cell_mouse_down_event = function(e) {
            if (e.which == 1) { // left mouse button event
                _this.is_mouse_down_left = true;
                _this.time_cell_selected = {
                    element: _this.$element.find('#' + $(this).attr('p_id')),
                    l_point: _this.$element.find('#l' + $(this).attr('p_id')),
                    t_element: $(this),
                    r_point: _this.$element.find('#r' + $(this).attr('p_id')),
                    hover: true
                };
                $(this).addClass('moving');
                _this.prev_cursor_x = _this.get_cursor_x_position(e);
            }
        };

        var left_point_mouse_down_event = function(e) {
            if (e.which == 1) { // left mouse button event
                _this.is_mouse_down_left = true;
                _this.left_point_selected = {
                    element: _this.$element.find('#' + $(this).attr('p_id')),
                    l_point: $(this),
                    t_element: _this.$element.find('#t' + $(this).attr('p_id')),
                    r_point: _this.$element.find('#r' + $(this).attr('p_id')),
                    hover: true
                };
                _this.left_point_selected.t_element.addClass('moving');
                _this.prev_cursor_x = _this.get_cursor_x_position(e);
            }
        };

        var right_point_mouse_down_event = function(e) {
            if (e.which == 1) { // left mouse button event
                _this.is_mouse_down_left = true;
                _this.right_point_selected = {
                    element: _this.$element.find('#' + $(this).attr('p_id')),
                    l_point: _this.$element.find('#l' + $(this).attr('p_id')),
                    t_element: _this.$element.find('#t' + $(this).attr('p_id')),
                    r_point: $(this),
                    hover: true
                };
                _this.right_point_selected.t_element.addClass('moving');
                _this.prev_cursor_x = _this.get_cursor_x_position(e);
            }
        };

        var t_class = '';
        var start;
        var stop = '';
        var style;
        var width;
        var left;
        $.each(cells, function(index, cell) {
            if (! _this.$element.find('#' + cell['_id']).length) {
                t_class = '';
                start = 'start_timestamp="' + (cell['start']).toString() + '"';
                stop = '';
                width = ((cell['stop'] ? (cell['stop']) : _this.current_timestamp) - (cell['start'])) * _this.px_per_ms;
                left = (((cell['start']) - _this.start_timestamp) * _this.px_per_ms);
                if (cell['stop']) {
                    stop = 'stop_timestamp="' + (cell['stop']).toString() + '"';
                }
                else {
                    t_class = ' current';
                }
                style = 'left:' + left.toString() + 'px;';
                style += 'width:' + width.toString() + 'px;';
                _this.$element.append(
                    '<div id="'+ cell['_id'] +'" class="timeline' + t_class + '" ' + start + ' ' + stop + ' style="' + style + '">' +
                        _this.time_duration(
                            (cell['stop'] ? (cell['stop']) : _this.current_timestamp) - (cell['start'])
                        ) +
                    '</div>' +
                    '<div id="l' + cell['_id'] + '" p_id="' + cell['_id'] + '" class="left-border-event" style="left:' + left.toString() + 'px;">' +
                        '<div class="prompt" style="top:-50px;left: -44px;">' +
                            '<div class="triangle-down"></div>' +
                            '<div class="body">' + _this.date_to_str(new Date(cell['start'])) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="t' + cell['_id'] + '" p_id="' + cell['_id'] + '" class="timeline-event' + t_class + '" style="' + style + '"></div>' +
                    (cell['stop'] ?
                        '<div id="r' + cell['_id'] + '" p_id="' + cell['_id'] + '" class="right-border-event" style="left:' + (left + width - 3) + 'px;">' +
                            '<div class="prompt" style="top:50px;left: -41px;">' +
                                '<div class="triangle-up"></div>' +
                                '<div class="body">' + _this.date_to_str(new Date(cell['stop'])) + '</div>' +
                            '</div>' +
                        '</div>'
                        : '')
                );

                // add events
                _this.$element.find('#l' + cell['_id']).mousedown(left_point_mouse_down_event)
                    .mouseover(function() {
                        if (! _this.is_mouse_down_left) {
                            var id = $(this).attr('p_id');
                            _this.$element.find('#t' + id).addClass('hover');
                            _this.$element.find('#l' + id + ' .prompt').fadeIn(150);
                        }
                        else {
                            (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = true;
                        }
                    })
                    .mouseout(function() {
                        if (! _this.is_mouse_down_left) {
                            var id = $(this).attr('p_id');
                            _this.$element.find('#t' + id).removeClass('hover');
                            _this.$element.find('#l' + id + ' .prompt').fadeOut(150);
                        }
                        else {
                            (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = false;
                        }
                    });
                if (cell['stop']) {
                    _this.$element.find('#t' + cell['_id']).mousedown(time_cell_mouse_down_event)
                        .mouseover(function() {
                            if (! _this.is_mouse_down_left) {
                                var id = $(this).attr('p_id');
                                _this.$element.find('#l' + id + ' .prompt').fadeIn(150);
                                _this.$element.find('#r' + id + ' .prompt').fadeIn(150);
                            }
                            else {
                                (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = true;
                            }
                        })
                        .mouseout(function() {
                            if (! _this.is_mouse_down_left) {
                                var id = $(this).attr('p_id');
                                _this.$element.find('#l' + id + ' .prompt').fadeOut(150);
                                _this.$element.find('#r' + id + ' .prompt').fadeOut(150);
                            }
                            else {
                                (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = false;
                            }
                        });
                    _this.$element.find('#r' + cell['_id']).mousedown(right_point_mouse_down_event)
                        .mouseover(function() {
                            if (! _this.is_mouse_down_left) {
                                var id = $(this).attr('p_id');
                                _this.$element.find('#t' + id).addClass('hover');
                                _this.$element.find('#r' + id + ' .prompt').fadeIn(150);
                            }
                            else {
                                (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = true;
                            }
                        })
                        .mouseout(function() {
                            if (! _this.is_mouse_down_left) {
                                var id = $(this).attr('p_id');
                                _this.$element.find('#t' + id).removeClass('hover');
                                _this.$element.find('#r' + id + ' .prompt').fadeOut(150);
                            }
                            else {
                                (_this.time_cell_selected || _this.left_point_selected || _this.right_point_selected).hover = false;
                            }
                        });
                }
                else {
                    _this.running_time_cell = _this.$element.find('#' + cell['_id']);
                }
            }
        });
    };

    TimeSlider.prototype.set_time_duration = function(element) {
        if (! element) return;
        element.html(
            this.time_duration(
                (element.attr('stop_timestamp') ?
                    parseInt(element.attr('stop_timestamp')) :
                    this.current_timestamp) - parseInt(element.attr('start_timestamp'))
            )
        );
    };

    TimeSlider.prototype.set_tooltips = function(element) {
        var left_border = this.$element.find('#l' + element.attr('id') + ' .prompt .body');
        var right_border = this.$element.find('#r' + element.attr('id') + ' .prompt .body');
        left_border.text(this.date_to_str(new Date(parseInt(element.attr('start_timestamp')))));
        if (right_border.length) {
            right_border.text(this.date_to_str(new Date(parseInt(element.attr('stop_timestamp')))));
        }
    };

    TimeSlider.prototype.set_current_timestamp = function() {
        var _this = this;
        return function() {
            // TODO: fix this
            _this.current_timestamp = _this.frozen_current_timestamp + (new Date() - _this.init_timestamp);
            if (_this.current_timestamp - _this.start_timestamp >= (3600 * 1000 * _this.options['hours_per_frame'])) {
                // TODO: update time slider to next day by ajax
            }
        }
    };

    TimeSlider.prototype.set_running_elements = function() {
        var _this = this;
        return function() {
            _this.set_time_caret_position();
            if (_this.running_time_cell) {
                _this.set_time_duration(_this.running_time_cell);
                var width = (_this.current_timestamp - parseInt(_this.running_time_cell.attr('start_timestamp'))) *
                    _this.px_per_ms;
                _this.running_time_cell.css('width', width + 2);
                _this.$element.find('#t' + _this.running_time_cell.attr('id')).css('width', width);
            }
        }
    };

    TimeSlider.prototype.set_time_caret_position = function() {
        this.time_caret.css('left', (this.current_timestamp - this.start_timestamp) * this.px_per_ms);
    };

    TimeSlider.prototype.set_timeslider_position = function(e, diff_x) {
        var _this = this;
        this.start_timestamp = this.start_timestamp - Math.round(diff_x / this.px_per_ms);

        this.set_time_caret_position();

        // update graduations
        var ms_offset = this.ms_to_next_hour(new Date(this.start_timestamp));
        var hour_caret = this.start_timestamp + ms_offset - 3600 * 1000 * 4;
        var hour_step_px = this.$element.width() / this.options['hours_per_frame'];
        var date_hour_caret;
        var caret_class;
        var i = -4;
        var left;
        var datetime_caret;
        this.$element.children('.each-hour-caret').each(function () {
            var elem = $(this);
            caret_class = '';
            date_hour_caret = new Date(hour_caret);
            if (date_hour_caret.getUTCHours() % 3 == 0) {
                caret_class = 'middle';
            }
            if (date_hour_caret.getUTCHours() == 0) {
                caret_class = 'big';
            }
            hour_caret += (3600 * 1000);
            elem.removeClass('middle big');
            if (caret_class) {
                elem.addClass(caret_class);
            }
            left = i * hour_step_px + _this.px_per_ms * ms_offset;
            elem.css('left', left);
            datetime_caret = _this.$element.find('#datetime-' + elem.attr('id')).css('left', left - 40).html(_this.graduation_title(date_hour_caret));
            if (caret_class) {
                datetime_caret.removeClass('hidden');
            }
            else {
                datetime_caret.addClass('hidden');
            }
            i++;
        });

        // update position and width of timelines
        this.$element.children('.timeline').each(function () {
            var elem = $(this);
            var start_timestamp = parseInt(elem.attr('start_timestamp'));
            var left = (start_timestamp - _this.start_timestamp) * _this.px_per_ms;
            elem.css('left', left);
            _this.$element.find('#l' + elem.attr('id')).css('left', left);
            _this.$element.find('#t' + elem.attr('id')).css('left', left);
            _this.$element.find('#r' + elem.attr('id')).css('left', left + parseInt(elem.css('width')) - 3);
        });
        if ( typeof this.options.on_move_timeslider_callback === 'function') {
            this.options.on_move_timeslider_callback(this.start_timestamp);
        }
    };

    TimeSlider.prototype.set_time_cell_position = function(e, diff_x) {
        var id = this.time_cell_selected.element.attr('id');
        var new_start = parseInt(this.time_cell_selected.element.attr('start_timestamp')) + Math.round(diff_x / this.px_per_ms);
        var new_stop = parseInt(this.time_cell_selected.element.attr('stop_timestamp')) + Math.round(diff_x / this.px_per_ms);
        this.time_cell_selected.element.attr('start_timestamp', new_start);
        this.time_cell_selected.element.attr('stop_timestamp', new_stop);
        this.time_cell_selected.element.css('left', parseInt(this.time_cell_selected.element.css('left')) + diff_x);
        this.time_cell_selected.l_point.css('left', parseInt(this.time_cell_selected.l_point.css('left')) + diff_x);
        this.time_cell_selected.t_element.css('left', parseInt(this.time_cell_selected.t_element.css('left')) + diff_x);
        this.time_cell_selected.r_point.css('left', parseInt(this.time_cell_selected.r_point.css('left')) + diff_x);
        this.set_tooltips(this.time_cell_selected.element);
        if (typeof this.options.on_move_time_cell_callback === 'function') {
            this.options.on_move_time_cell_callback(id, new_start, new_stop);
        }
    };

    TimeSlider.prototype.set_point_position = function(e, diff_x) {
        var attr;
        var element;
        var width;
        var left;
        var point;
        if (this.left_point_selected) {
            point = 'left';
            element = this.left_point_selected.element;
            attr = 'start_timestamp';
            left = parseInt(this.left_point_selected.element.css('left')) + diff_x;
            width = parseInt(this.left_point_selected.element.css('width')) + diff_x * (-1);
            this.left_point_selected.element.css('left', left);
            this.left_point_selected.element.css('width', width);
            this.left_point_selected.l_point.css('left', left);
            this.left_point_selected.t_element.css('width', width);
            this.left_point_selected.t_element.css('left', left);
        }
        else {
            point = 'right';
            element = this.right_point_selected.element;
            attr = 'stop_timestamp';
            width = parseInt(this.right_point_selected.element.css('width')) + diff_x ;
            this.right_point_selected.element.css('width', width);
            this.right_point_selected.t_element.css('width', width);
            this.right_point_selected.r_point.css('left', parseInt(this.right_point_selected.r_point.css('left')) + diff_x);
        }
        element.attr(
            attr,
            parseInt(element.attr(attr)) + Math.round(diff_x / this.px_per_ms)
        );
        this.set_time_duration(element);
        this.set_tooltips(element);
        if (typeof this.options.on_resize_time_cell_callback === 'function') {
            this.options.on_resize_time_cell_callback(
                element.attr('id'),
                parseInt(element.attr('start_timestamp')),
                parseInt(element.attr('stop_timestamp')),
                point
            );
        }
    };

    TimeSlider.prototype.get_cursor_x_position = function(e) {
        var posx = 0;

        if (! e) {
            e = window.event;
        }

        if (e.pageX || e.pageY) {
            posx = e.pageX;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        }
        return posx;
    };

    TimeSlider.prototype.cursor_moving_event = function() {
        var _this = this;
        return function(e) {
            var pos_x = _this.get_cursor_x_position(e);
            if (_this.is_mouse_down_left) {
                if (_this.time_cell_selected) {
                    _this.set_time_cell_position(e, pos_x - _this.prev_cursor_x);
                }
                else if (_this.left_point_selected || _this.right_point_selected) {
                    _this.set_point_position(e, pos_x - _this.prev_cursor_x);
                }
                else {
                    _this.set_timeslider_position(e, pos_x - _this.prev_cursor_x);
                }
            }
            _this.prev_cursor_x = pos_x;
        }
    };

    TimeSlider.prototype.mouse_up_event = function() {
        var _this = this;
        return function(e) {
            if (e.which == 1) { // left mouse button event
                _this.is_mouse_down_left = false;
                if (_this.time_cell_selected) {
                    if (! _this.time_cell_selected.hover) {
                        _this.time_cell_selected.l_point.find('.prompt').fadeOut(150);
                        _this.time_cell_selected.r_point.find('.prompt').fadeOut(150);
                    }
                    if (typeof _this.options.on_change_time_cell_callback === 'function') {
                        _this.options.on_change_time_cell_callback(
                            _this.time_cell_selected.element.attr('id'),
                            parseInt(_this.time_cell_selected.element.attr('start_timestamp')),
                            parseInt(_this.time_cell_selected.element.attr('stop_timestamp'))
                        );
                    }
                    _this.time_cell_selected.t_element.removeClass('moving');
                    _this.time_cell_selected = null;
                }
                else if (_this.left_point_selected || _this.right_point_selected) {
                    if (! (_this.left_point_selected || _this.right_point_selected).hover) {
                        if (_this.left_point_selected) {
                            _this.left_point_selected.l_point.find('.prompt').fadeOut(150);
                        }
                        else if (_this.right_point_selected) {
                            _this.right_point_selected.r_point.find('.prompt').fadeOut(150);
                        }
                    }
                    var t_element = (_this.left_point_selected || _this.right_point_selected).t_element;
                    if (typeof _this.options.on_change_time_cell_callback === 'function') {
                        var element = (_this.left_point_selected || _this.right_point_selected).element;
                        _this.options.on_change_time_cell_callback(
                            element.attr('id'),
                            parseInt(element.attr('start_timestamp')),
                            parseInt(element.attr('stop_timestamp'))
                        );
                    }
                    t_element.removeClass('moving');
                    _this.left_point_selected = null;
                    _this.right_point_selected = null;
                }
                else {
                    if ( typeof _this.options.on_change_timeslider_callback === 'function') {
                        _this.options.on_change_timeslider_callback.bind(_this)(_this.start_timestamp);
                    }
                }
            }
        }
    };

    TimeSlider.prototype.timeslider_mouse_down_event = function() {
        var _this = this;
        return function(e) {
            if (e.which == 1) { // left mouse button event
                _this.is_mouse_down_left = true;
                _this.prev_cursor_x = _this.get_cursor_x_position(e);
            }
        }
    };


    // TIMESLIDER PLUGIN DEFINITION
    // ============================

    function Plugin(options) {
        return this.each(function() {
            new TimeSlider($(this), options);
        });
    }

    var old = $.fn.TimeSlider;

    $.fn.TimeSlider = Plugin;

    $.fn.TimeSlider.noConflict = function() {
        $.fn.TimeSlider = old;
        return this;
    };
})(jQuery);
