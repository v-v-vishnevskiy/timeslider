/*!
 * Timeslider v0.9.4
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
    if ((version[0] < 2 && version[1] < 6) || (version[0] == 1 && version[1] == 6 && version[2] < 1)) {
        throw new Error('Timeslider\'s JavaScript requires jQuery version 1.6.1 or higher');
    }
}(jQuery));


(function ($) {
    var TimeSlider = function(element, options) {
        this.$element = null;
        this.$ruler = null;
        this.$prompts = null;
        this.options = null;
        this.init_timestamp = new Date();
        this.frozen_current_timestamp = 0;
        this.px_per_ms = 1;
        this.is_mouse_down_left = false;
        this.prev_cursor_x = 0;
        this.time_cell_selected = null;
        this.running_time_cell = null;
        this.time_caret = null;
        this.steps_by_minutes = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 720, 1440];
        this.gt_height = 0;

        this.init(element, options);
        return this;
    };

    TimeSlider.VERSION = '0.9.4';

    TimeSlider.DEFAULTS = {
        start_timestamp: (new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60 * 1000 * -1),   // left border
        current_timestamp: (new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60 * 1000 * -1), // current timestamp
        hours_per_ruler: 24,                    // length of graduation ruler in hours (min 1, max 48)
        graduation_step: 20,                    // minimum pixels between graduations
        distance_between_gtitle: 80,            // minimum pixels between titles of graduations
        update_timestamp_interval: 1000,        // interval for updating current time
        update_interval: 1000,                  // interval for updating elements
        show_ms: false,                         // whether to show the milliseconds?
        init_cells: null,                       // list of time cells or function
        draggable: true,
        on_add_timecell_callback: null,
        on_toggle_timecell_callback: null,
        on_remove_timecell_callback: null,
        on_remove_all_timecells_callback: null,
        on_dblclick_timecell_callback: null,
        on_move_timecell_callback: null,
        on_resize_timecell_callback: null,
        on_change_timecell_callback: null,
        on_dblclick_ruler_callback: null,
        on_move_ruler_callback: null,
        on_change_ruler_callback: null
    };

    TimeSlider.prototype.init = function(element, options) {
        this.$element = $(element);
        this.$element.append('<div class="graduation-title" style="display:none">init</div>');
        this.gt_height = this.$element.find('.graduation-title').height();
        this.$element.find('.graduation-title').remove();
        this.$element.append(
            '<div class="ruler" style="height:' + (this.$element.height() + this.gt_height) + 'px;"></div>' +
            '<div class="prompts" style="top:-' + (this.$element.height() * 2 + this.gt_height) + 'px;"></div>'
        );
        this.$element.height(this.$element.height() + this.gt_height);
        this.$ruler = this.$element.find('.ruler');
        this.$prompts = this.$element.find('.prompts');

        if (this.$element.attr('start_timestamp')) {
            options['start_timestamp'] = parseInt(this.$element.attr('start_timestamp'));
        }
        if (this.$element.attr('current_timestamp')) {
            this.frozen_current_timestamp = options['current_timestamp'] = parseInt(this.$element.attr('current_timestamp'));
        }
        this.options = this.get_options(options);
        this.px_per_ms = this.$element.width() / (this.options.hours_per_ruler * 3600 * 1000);

        // append background color and event layout
        var draggableClass = !this.options.draggable ? ' draggable-off' : '';
        this.$ruler.append(
            '<div class="bg"></div><div class="bg-event' + draggableClass + '"></div>'
        );

        this.add_time_caret();
        this.add_graduations();
        if (this.options.init_cells) {
            if (typeof this.options.init_cells == 'function') {
                this.options.init_cells.bind(this).call();
            }
            else {
                this.add_cells(this.options.init_cells);
            }
        }
        this.add_events();
    };

    TimeSlider.prototype.get_defaults = function() {
        return TimeSlider.DEFAULTS;
    };

    TimeSlider.prototype.time_duration = function(ms) {
        var h = Math.floor(ms / (3600 * 1000));
        var m = Math.floor((ms - (h * (3600 * 1000))) / (60 * 1000));
        var s = Math.floor((ms - (h * (3600 * 1000)) - (m * (60 * 1000))) / 1000);
        var _ms = ms - (h * (3600 * 1000)) - (m * (60 * 1000)) - (s * 1000);
        if (this.options.show_ms) {
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

    TimeSlider.prototype.get_options = function (options) {
        options = $.extend({}, this.get_defaults(), options);
        return this.validate_options(options);
    };

    TimeSlider.prototype.validate_options = function (options) {
        if (options['hours_per_ruler'] < 1) {
            options['hours_per_ruler'] = 1;
        }
        else if (options['hours_per_ruler'] > 48) {
            options['hours_per_ruler'] = 48;
        }

        if (options['update_timestamp_interval'] < 1) {
            options['update_timestamp_interval'] = 1;
        }

        if (options['update_interval'] < options['update_timestamp_interval']) {
            options['update_interval'] = options['update_timestamp_interval'];
        }

        if (options['start_timestamp'] && options['start_timestamp'] >= 0) {
            options['start_timestamp'] = options['start_timestamp'];
        }

        if (options['current_timestamp'] && options['current_timestamp'] >= 0) {
            this.frozen_current_timestamp = options['current_timestamp'] = options['current_timestamp'];
        }

        if (options['graduation_step'] > this.$ruler.width()) {
            options['graduation_step'] = this.$ruler.width();
        }
        else if (options['graduation_step'] < 5) {
            options['graduation_step'] = 5;
        }

        return options;
    };

    TimeSlider.prototype.set_options = function (options) {
        if (options.hours_per_ruler) {
            options = $.extend({}, this.options, options);

            // hours
            if (options.hours_per_ruler != this.options.hours_per_ruler) {
                this.options.hours_per_ruler = options.hours_per_ruler;
                this.px_per_ms = this.$ruler.width() / (this.options.hours_per_ruler * 3600 * 1000);
                this.remove_graduations();
                this.add_graduations();
                this.set_time_caret_position();
                this.set_time_cells_position();
            }
        }
    };

    TimeSlider.prototype.timestamp_to_date = function(timestamp) {
        var datetime = new Date(timestamp);
        return ('0' + datetime.getUTCDate().toString()).substr(-2) + '.' +
            ('0' + (datetime.getUTCMonth() + 1).toString()).substr(-2) + '.' +
            datetime.getUTCFullYear() + ' ' +
            ('0' + datetime.getUTCHours().toString()).substr(-2) + ':' +
            ('0' + datetime.getUTCMinutes().toString()).substr(-2) + ':' +
            ('0' + datetime.getUTCSeconds().toString()).substr(-2) +
            (this.options.show_ms ? ('.' + ('00' + datetime.getUTCMilliseconds().toString()).substr(-3)) : '');
    };

    TimeSlider.prototype.graduation_title = function(datetime) {
        if (datetime.getUTCHours() == 0 && datetime.getUTCMinutes() == 0 && datetime.getUTCMilliseconds() == 0) {
            return ('0' + datetime.getUTCDate().toString()).substr(-2) + '.' +
                ('0' + (datetime.getUTCMonth() + 1).toString()).substr(-2) + '.' +
                datetime.getUTCFullYear();
        }
        return datetime.getUTCHours() + ':' + ('0' + datetime.getUTCMinutes().toString()).substr(-2);
    };

    TimeSlider.prototype.ms_to_next_step = function(timestamp, step) {
        var remainder = timestamp % step;
        return remainder ? step - remainder : 0;
    };

    TimeSlider.prototype.set_style = function(style, element) {
        if (style) {
            if (element) {
                element.css(style);
            }
            else {
                var result = '';
                for (var property in style) {
                    if (style.hasOwnProperty(property)) {
                        result += property + ':' + style[property] + ';';
                    }
                }
                return result;
            }
        }
        return '';
    };

    TimeSlider.prototype.add_events = function() {
        var _this = this;
        window.setInterval(this.set_current_timestamp(), this.options['update_timestamp_interval']);
        window.setInterval(this.set_running_elements(), this.options['update_interval']);
        $('body').mouseup(this.mouse_up_event());
        $('body').mousemove(this.cursor_moving_event());
        this.$ruler.find('.bg-event').mousedown(this.timeslider_mouse_down_event());
        if (typeof this.options.on_dblclick_ruler_callback == 'function') {
            this.$ruler.find('.bg-event').dblclick(function () {
                _this.options.on_dblclick_ruler_callback(
                    _this.options.start_timestamp,
                    _this.options.current_timestamp
                );
            });
        }
    };

    TimeSlider.prototype.add_time_caret = function() {
        this.$ruler.append('<div class="current-time-caret"></div>');
        this.time_caret = this.$ruler.find('.current-time-caret');
        this.set_time_caret_position();
    };

    TimeSlider.prototype.add_graduations = function() {
        var px_per_minute = this.$ruler.width() / (this.options.hours_per_ruler * 60);
        var px_per_step = this.options.graduation_step;
        var min_step = px_per_step / px_per_minute;
        for (var i = 0; i < this.steps_by_minutes.length; i++) {
            if (min_step <= this.steps_by_minutes[i]) {
                min_step = this.steps_by_minutes[i];
                px_per_step = min_step * px_per_minute;
                break;
            }
        }

        var medium_step = 30;
        for (var i = 0; i < this.steps_by_minutes.length; i++) {
            if (this.options.distance_between_gtitle / px_per_minute <= this.steps_by_minutes[i]) {
                medium_step = this.steps_by_minutes[i];
                break;
            }
        }

        var ms_offset = this.ms_to_next_step(this.options.start_timestamp, min_step * 60 * 1000);
        var minute_caret = this.options.start_timestamp + ms_offset - (min_step * 60 * 1000) * 4;
        var num_steps = this.$ruler.width() / px_per_step;
        var date;
        var caret_class;
        var left;
        for (var i = -4; i <= num_steps; i++) {
            caret_class = '';
            date = new Date(minute_caret);
            left = i * px_per_step + this.px_per_ms * ms_offset;
            if (date.getUTCHours() == 0 && date.getUTCMinutes() == 0) {
                caret_class = 'big';
            }
            else if (minute_caret / (60 * 1000) % medium_step == 0) {
                caret_class = 'middle';
            }
            this.$ruler.append('<div id="hour' + i + '" class="graduation ' + caret_class + '" style="left: ' + left.toString() + 'px"></div>');
            this.$ruler.append(
                '<div id="graduation-title-hour' + i + '" class="graduation-title' + (caret_class ? '' : ' hidden') + '" style="left:' + (left - 40).toString() + 'px">' +
                    this.graduation_title(date) +
                '</div>'
            );
            minute_caret += min_step * 60 * 1000;
        }
    };

    /* Start new or stop current timecell */
    TimeSlider.prototype.toggle_timecell = function(timecell) {
        // stop timecell
        var timecell_id = null;
        var start = null;
        var stop = null;
        if (this.running_time_cell) {
            var running_timecell = this.running_time_cell;
            this.running_time_cell = null;
            timecell_id = running_timecell.attr('id');
            stop = this.options.current_timestamp;
            if (timecell && timecell.stop) {
                stop = timecell.stop;
            }
            start = parseInt(running_timecell.attr('start_timestamp'));
            running_timecell.attr('stop_timestamp', stop);
            var width = (stop - start) * this.px_per_ms;
            var left = (start - this.options.start_timestamp) * this.px_per_ms;
            this.$prompts.append(
                '<div id="r-prompt-' + timecell_id + '" class="prompt" style="top:101px;left: ' + (left + width - 44).toString() + 'px;">' +
                    '<div class="triangle-up"></div>' +
                    '<div class="body">' + this.timestamp_to_date(stop) + '</div>' +
                '</div>');
            running_timecell.removeClass('current');
            this.$ruler.find('#t' + timecell_id).removeClass('current');
            this.set_time_duration(running_timecell);
            this.set_style(timecell['style'], running_timecell);
        }
        // start new timecell
        else {
            if (! timecell || typeof timecell != 'object') {
                timecell = {};
            }
            if (! timecell['start']) {
                timecell['start'] = this.options.current_timestamp;
            }
            delete timecell['stop'];
            timecell = this.add_cell(timecell);
            if (timecell) {
                timecell_id = timecell['_id'];
                start = timecell['start'];
            }
        }
        if (typeof this.options.on_toggle_timecell_callback == 'function') {
            this.options.on_toggle_timecell_callback(timecell_id, start, stop);
        }
    };

    /* Add finished timecell */
    TimeSlider.prototype.add_timecell = function(timecell) {
        var timecell_id = null;
        var start = null;
        var stop = null;
        if (timecell && typeof timecell == 'object' && timecell['stop']) {
            timecell = this.add_cell(timecell);
            if (timecell) {
                timecell_id = timecell['_id'];
                start = timecell['start'];
                stop = timecell['stop'];
            }
        }
        if (typeof this.options.on_add_timecell_callback == 'function') {
            this.options.on_add_timecell_callback(timecell_id, start, stop);
        }
    };

    TimeSlider.prototype.remove_timecell = function(timecell_id) {
        var timecell = this.$ruler.find('#' + timecell_id);
        var start = null;
        var stop = null;
        if (timecell.length) {
            start = parseInt(timecell.attr('start_timestamp'));
            if (this.running_time_cell && this.running_time_cell.attr('id') == timecell_id) {
                this.running_time_cell = null;
            }
            else {
                stop = parseInt(timecell.attr('stop_timestamp'));
            }
            timecell.remove();
            this.$ruler.find('#t' + timecell_id).remove();
            this.$prompts.find('#l-prompt-' + timecell_id).remove();
            this.$prompts.find('#r-prompt-' + timecell_id).remove();
        }
        else {
            timecell_id = null;
        }
        if (typeof this.options.on_remove_timecell_callback == 'function') {
            this.options.on_remove_timecell_callback(timecell_id, start, stop);
        }
    };

    TimeSlider.prototype.remove_all_timecells = function() {
        var timecells = [];
        var _this = this;
        var $timecells = this.$ruler.children('.timecell');
        var defer = $.Deferred();
        $timecells.each(function (index) {
            timecells.push({
                _id: $(this).attr('id'),
                start: parseInt($(this).attr('start_timestamp')),
                stop: $(this).attr('stop_timestamp') ? parseInt($(this).attr('stop_timestamp')) : null
            });
            if (index + 1 == $timecells.length) {
                defer.resolve(timecells);
            }
        });
        $.when(defer).then(function (result) {
            this.running_time_cell = null;
            _this.$ruler.children('.timecell').remove();
            _this.$ruler.children('.timecell-event').remove();
            _this.$prompts.children('.prompt').remove();
            if (typeof _this.options.on_remove_all_timecells_callback == 'function') {
                _this.options.on_remove_all_timecells_callback(result);
            }
        });
    };

    TimeSlider.prototype.remove_graduations = function() {
        this.$ruler.find('.graduation').remove();
        this.$ruler.find('.graduation-title').remove();
    };

    TimeSlider.prototype.add_cell = function(timecell) {
        var _this = this;

        if (! timecell['start']) {
            return false;
        }

        if (! timecell['_id']) {
            timecell['_id'] = 'cell-' + timecell['start'];
        }

        var get_selected_area = function(e) {
            var width = parseFloat($(this).css('width'));
            var pos_x = parseFloat(e.offsetX);
            if (pos_x <= 3) {
                return 'left';
            }
            else if (pos_x > 3 && pos_x < (width - 4)) {
                return 'center';
            }
            else {
                return 'right';
            }
        };

        var time_cell_mousedown_event = function(e) {
            if (e.which == 1) { // left mouse button event
                var id = $(this).attr('p_id');
                switch(get_selected_area.call(this, e)) {
                    case 'left':
                        _this.time_cell_selected = {
                            element: _this.$ruler.find('#' + id),
                            l_prompt: _this.$prompts.find('#l-prompt-' + id + '.prompt'),
                            t_element: $(this),
                            hover: true
                        };
                        _this.is_mouse_down_left = true;
                        $(this).addClass('moving');
                        break;
                    case 'center':
                        if (! $(this).hasClass('current')) {
                            _this.time_cell_selected = {
                                element: _this.$ruler.find('#' + id),
                                l_prompt: _this.$prompts.find('#l-prompt-' + id + '.prompt'),
                                t_element: $(this),
                                r_prompt: _this.$prompts.find('#r-prompt-' + id + '.prompt'),
                                hover: true
                            };
                            _this.is_mouse_down_left = true;
                            $(this).addClass('moving');
                        }
                        break;
                    case 'right':
                        if (! $(this).hasClass('current')) {
                            _this.time_cell_selected = {
                                element: _this.$ruler.find('#' + id),
                                t_element: $(this),
                                r_prompt: _this.$prompts.find('#r-prompt-' + id + '.prompt'),
                                hover: true
                            };
                            _this.is_mouse_down_left = true;
                            $(this).addClass('moving');
                        }
                        break;
                }
                _this.prev_cursor_x = _this.get_cursor_x_position(e);
            }
        };

        var time_cell_mousemove_event = function(e) {
            if (! _this.is_mouse_down_left) {
                var id = $(this).attr('p_id');
                $(this).addClass('hover');
                switch(get_selected_area.call(this, e)) {
                    case 'left':
                        _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeIn(150);
                        _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeOut(150);
                        $(this).css('cursor', 'w-resize');
                        break;
                    case 'center':
                        if ($(this).hasClass('current')) {
                            $(this).css('cursor', 'default');
                            _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeOut(150);
                            _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeOut(150);
                        }
                        else {
                            _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeIn(150);
                            _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeIn(150);
                            $(this).css('cursor', 'move');
                        }
                        break;
                    case 'right':
                        if ($(this).hasClass('current')) {
                            $(this).css('cursor', 'default');
                            _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeOut(150);
                            _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeOut(150);
                        }
                        else {
                            _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeOut(150);
                            _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeIn(150);
                            $(this).css('cursor', 'e-resize');
                        }
                        break;
                }
            }
            else {
                if (_this.time_cell_selected) {
                    _this.time_cell_selected.hover = true;
                }
            }
        };

        var time_cell_mouseout_event = function(e) {
            if (! _this.is_mouse_down_left) {
                var id = $(this).attr('p_id');
                _this.$prompts.find('#l-prompt-' + id + '.prompt').fadeOut(150);
                _this.$prompts.find('#r-prompt-' + id + '.prompt').fadeOut(150);
                $(this).css('cursor', 'move');
                $(this).removeClass('hover');
            }
            else {
                if (_this.time_cell_selected) {
                    _this.time_cell_selected.hover = true;
                }
            }
        };

        var t_class = '';
        var start;
        var stop = '';
        var style;
        var width;
        var left;
        if (! this.$ruler.find('#' + timecell['_id']).length) {
            t_class = '';
            start = 'start_timestamp="' + (timecell['start']).toString() + '"';
            stop = '';
            width = ((timecell['stop'] ? (timecell['stop']) : this.options.current_timestamp) - (timecell['start'])) * this.px_per_ms;
            left = (((timecell['start']) - this.options.start_timestamp) * this.px_per_ms);
            if (timecell['stop']) {
                stop = 'stop_timestamp="' + (timecell['stop']).toString() + '"';
            }
            else {
                t_class = ' current';
            }
            style = 'left:' + left.toString() + 'px;';
            style += 'width:' + width.toString() + 'px;';
            var timecell_style = this.set_style(timecell['style']);
            this.$ruler.append(
                '<div id="'+ timecell['_id'] +'" class="timecell' + t_class + '" ' + start + ' ' + stop + ' style="' + style + timecell_style + '">' +
                    this.time_duration(
                        (timecell['stop'] ? (timecell['stop']) : this.options.current_timestamp) - (timecell['start'])
                    ) +
                '</div>' +
                '<div id="t' + timecell['_id'] + '" p_id="' + timecell['_id'] + '" class="timecell-event' + t_class + '" style="' + style + '"></div>'
            );
            this.$prompts.append(
                '<div id="l-prompt-' + timecell['_id'] + '" class="prompt" style="top:9px;left:' + (left - 44).toString() + 'px;">' +
                    '<div class="triangle-down"></div>' +
                    '<div class="body">' + this.timestamp_to_date(timecell['start']) + '</div>' +
                '</div>' +
                (timecell['stop'] ?
                    '<div id="r-prompt-' + timecell['_id'] + '" class="prompt" style="top:101px;left: ' + (left + width - 44).toString() + 'px;">' +
                        '<div class="triangle-up"></div>' +
                        '<div class="body">' + this.timestamp_to_date(timecell['stop']) + '</div>' +
                    '</div>'
                    : '')
            );

            if (! timecell['stop']) {
                if (this.running_time_cell) {
                    throw new Error('Can\'t run several time cells');
                }
                else {
                    this.running_time_cell = this.$ruler.find('#' + timecell['_id']);
                }
            }

            // add events
            var t_element = this.$ruler.find('#t' + timecell['_id']);
            t_element
                .mousedown(time_cell_mousedown_event)
                .mousemove(time_cell_mousemove_event)
                .mouseout(time_cell_mouseout_event);
            if (typeof this.options.on_dblclick_timecell_callback == 'function') {
                t_element.dblclick(function() {
                    var p_id = $(this).attr('p_id');
                    var cell_element = _this.$ruler.find('#' + p_id);
                    var start = parseInt(cell_element.attr('start_timestamp'));
                    var stop = cell_element.attr('stop_timestamp');
                    stop = stop ? parseInt(stop) : null;
                    _this.options.on_dblclick_timecell_callback(p_id, start, stop);
                });
            }
            return timecell;
        }
        return false;
    };

    TimeSlider.prototype.add_cells = function(cells) {
        var _this = this;
        $.each(cells, function(index, cell) {
            _this.add_cell(cell);
        });
    };

    TimeSlider.prototype.set_time_duration = function(element) {
        if (! element) return;
        var start = parseInt(element.attr('start_timestamp'));
        var stop = element.attr('stop_timestamp') ? parseInt(element.attr('stop_timestamp')) : this.options.current_timestamp;
        if (! this.options.show_ms) {
            start = Math.floor(start / 1000) * 1000;
            stop = Math.floor(stop / 1000) * 1000;
        }
        element.html(this.time_duration(stop - start));
    };

    TimeSlider.prototype.set_tooltips = function(element) {
        if(element.l_prompt) {
            element.l_prompt.find('.body').text(
                this.timestamp_to_date(parseInt(element.element.attr('start_timestamp')))
            );
        }
        if(element.r_prompt) {
            element.r_prompt.find('.body').text(
                this.timestamp_to_date(parseInt(element.element.attr('stop_timestamp')))
            );
        }
    };

    TimeSlider.prototype.set_current_timestamp = function() {
        var _this = this;
        return function() {
            // TODO: fix this
            _this.options.current_timestamp = _this.frozen_current_timestamp + (new Date() - _this.init_timestamp);
            if (_this.options.current_timestamp - _this.options.start_timestamp >= (3600 * 1000 * _this.options.hours_per_ruler)) {
                // TODO: update time slider to next day if timeslider was not moved
            }
        }
    };

    TimeSlider.prototype.set_running_elements = function() {
        var _this = this;
        return function() {
            _this.set_time_caret_position();
            if (_this.running_time_cell) {
                _this.set_time_duration(_this.running_time_cell);
                var width = (_this.options.current_timestamp - parseInt(_this.running_time_cell.attr('start_timestamp'))) *
                    _this.px_per_ms;
                _this.running_time_cell.css('width', width);
                _this.$ruler.find('#t' + _this.running_time_cell.attr('id')).css('width', width);
            }
        }
    };

    TimeSlider.prototype.set_time_caret_position = function() {
        this.time_caret.css('left', (this.options.current_timestamp - this.options.start_timestamp) * this.px_per_ms);
    };

    TimeSlider.prototype.set_time_cells_position = function() {
        var _this = this;
        this.$ruler.children('.timecell').each(function () {
            var start_timestamp = parseInt($(this).attr('start_timestamp'));
            var left = (start_timestamp - _this.options.start_timestamp) * _this.px_per_ms;
            var width = (($(this).attr('stop_timestamp')
                ? parseInt($(this).attr('stop_timestamp'))
                : _this.options.current_timestamp) - start_timestamp) * _this.px_per_ms;
            $(this).css('left', left);
            $(this).css('width', width);
            _this.$prompts.find('#l-prompt-' + $(this).attr('id') + '.prompt').css(
                'left',
                left - 44
            );
            _this.$ruler.find('#t' + $(this).attr('id')).css('left', left).css('width', width);
            _this.$prompts.find('#r-prompt-' + $(this).attr('id') + '.prompt').css(
                'left',
                left + width - 44
            );
        });
    };

    TimeSlider.prototype.set_timeslider_position = function(e, diff_x) {
        var _this = this;
        this.options.start_timestamp = this.options.start_timestamp - Math.round(diff_x / this.px_per_ms);

        this.set_time_caret_position();

        var px_per_minute = this.$ruler.width() / (this.options.hours_per_ruler * 60);
        var px_per_step = this.options.graduation_step;
        var min_step = px_per_step / px_per_minute;
        for (var i = 0; i < this.steps_by_minutes.length; i++) {
            if (min_step <= this.steps_by_minutes[i]) {
                min_step = this.steps_by_minutes[i];
                px_per_step = min_step * px_per_minute;
                break;
            }
        }

        var medium_step = 30;
        for (var i = 0; i < this.steps_by_minutes.length; i++) {
            if (this.options.distance_between_gtitle / px_per_minute <= this.steps_by_minutes[i]) {
                medium_step = this.steps_by_minutes[i];
                break;
            }
        }

        var ms_offset = this.ms_to_next_step(this.options.start_timestamp, min_step * 60 * 1000);
        var minute_caret = this.options.start_timestamp + ms_offset - (min_step * 60 * 1000) * 4;
        var date;
        var caret_class;
        var left;
        var datetime_caret;
        var i = -4;
        this.$ruler.children('.graduation').each(function () {
            caret_class = '';
            date = new Date(minute_caret);
            left = i * px_per_step + _this.px_per_ms * ms_offset;
            if (date.getUTCHours() == 0 && date.getUTCMinutes() == 0) {
                caret_class = 'big';
            }
            else if (minute_caret / (60 * 1000) % medium_step == 0) {
                caret_class = 'middle';
            }
            $(this).removeClass('middle big');
            if (caret_class) {
                $(this).addClass(caret_class);
            }
            $(this).css('left', left);
            datetime_caret = _this.$ruler.find('#graduation-title-' + $(this).attr('id')).css('left', left - 40).html(_this.graduation_title(date));
            if (caret_class) {
                datetime_caret.removeClass('hidden');
            }
            else {
                datetime_caret.addClass('hidden');
            }
            minute_caret += min_step * 60 * 1000;
            i++;
        });
        this.set_time_cells_position();
        if (typeof this.options.on_move_ruler_callback == 'function') {
            this.options.on_move_ruler_callback(this.options.start_timestamp);
        }
    };

    TimeSlider.prototype.set_time_cell_position = function(e, diff_x) {
        var id = this.time_cell_selected.element.attr('id');

        // move all time cell
        if (this.time_cell_selected.l_prompt && this.time_cell_selected.r_prompt) {
            var new_start = parseInt(this.time_cell_selected.element.attr('start_timestamp')) + Math.round(diff_x / this.px_per_ms);
            var new_stop = parseInt(this.time_cell_selected.element.attr('stop_timestamp')) + Math.round(diff_x / this.px_per_ms);
            this.time_cell_selected.element.attr('start_timestamp', new_start);
            this.time_cell_selected.element.attr('stop_timestamp', new_stop);
            this.time_cell_selected.element.css('left', parseFloat(this.time_cell_selected.element.css('left')) + diff_x);
            this.time_cell_selected.l_prompt.css('left', parseFloat(this.time_cell_selected.l_prompt.css('left')) + diff_x);
            this.time_cell_selected.t_element.css('left', parseFloat(this.time_cell_selected.t_element.css('left')) + diff_x);
            this.time_cell_selected.r_prompt.css('left', parseFloat(this.time_cell_selected.r_prompt.css('left')) + diff_x);
            this.set_tooltips(this.time_cell_selected);
            if (typeof this.options.on_move_timecell_callback == 'function') {
                this.options.on_move_timecell_callback(id, new_start, new_stop);
            }
        }
        // resize left border
        else if (this.time_cell_selected.l_prompt) {
            var new_start = parseInt(this.time_cell_selected.element.attr('start_timestamp')) + Math.round(diff_x / this.px_per_ms);
            var width = parseFloat(this.time_cell_selected.element.css('width')) + diff_x * (-1);
            this.time_cell_selected.element.attr('start_timestamp', new_start);
            this.time_cell_selected.element.css('left', parseFloat(this.time_cell_selected.element.css('left')) + diff_x);
            this.time_cell_selected.element.css('width', width);
            this.time_cell_selected.l_prompt.css('left', parseFloat(this.time_cell_selected.l_prompt.css('left')) + diff_x);
            this.time_cell_selected.t_element.css('left', parseFloat(this.time_cell_selected.t_element.css('left')) + diff_x);
            this.time_cell_selected.t_element.css('width', width);
            this.set_time_duration(this.time_cell_selected.element);
            this.set_tooltips(this.time_cell_selected);
            if (typeof this.options.on_resize_timecell_callback == 'function') {
                this.options.on_resize_timecell_callback(
                    id,
                    parseInt(this.time_cell_selected.element.attr('start_timestamp')),
                    parseInt(this.time_cell_selected.element.attr('stop_timestamp')),
                    'left'
                );
            }
        }
        // resize right border
        else if (this.time_cell_selected.r_prompt) {
            var new_stop = parseInt(this.time_cell_selected.element.attr('stop_timestamp')) + Math.round(diff_x / this.px_per_ms);
            this.time_cell_selected.element.attr('stop_timestamp', new_stop);
            this.time_cell_selected.element.css('width', parseFloat(this.time_cell_selected.element.css('width')) + diff_x);
            this.time_cell_selected.t_element.css('width', parseFloat(this.time_cell_selected.t_element.css('width')) + diff_x);
            this.time_cell_selected.r_prompt.css('left', parseFloat(this.time_cell_selected.r_prompt.css('left')) + diff_x);
            this.set_time_duration(this.time_cell_selected.element);
            this.set_tooltips(this.time_cell_selected);
            if (typeof this.options.on_resize_timecell_callback == 'function') {
                this.options.on_resize_timecell_callback(
                    id,
                    parseInt(this.time_cell_selected.element.attr('start_timestamp')),
                    parseInt(this.time_cell_selected.element.attr('stop_timestamp')),
                    'right'
                );
            }
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
                        _this.$prompts.find('#l-prompt-' + _this.time_cell_selected.element.attr('id') + '.prompt').fadeOut(150);
                        _this.$prompts.find('#r-prompt-' + _this.time_cell_selected.element.attr('id') + '.prompt').fadeOut(150);
                        _this.time_cell_selected.t_element.removeClass('hover');
                    }
                    if (typeof _this.options.on_change_timecell_callback == 'function') {
                        _this.options.on_change_timecell_callback(
                            _this.time_cell_selected.element.attr('id'),
                            parseInt(_this.time_cell_selected.element.attr('start_timestamp')),
                            parseInt(_this.time_cell_selected.element.attr('stop_timestamp'))
                        );
                    }
                    _this.time_cell_selected.t_element.removeClass('moving');
                    _this.time_cell_selected = null;
                }
                else {
                    if (typeof _this.options.on_change_ruler_callback == 'function') {
                        _this.options.on_change_ruler_callback.bind(_this)(_this.options.start_timestamp);
                    }
                }
            }
        }
    };

    TimeSlider.prototype.timeslider_mouse_down_event = function() {
        var _this = this;
        return function(e) {
            if (_this.options.draggable) {
                if (e.which == 1) { // left mouse button event
                    _this.is_mouse_down_left = true;
                    _this.prev_cursor_x = _this.get_cursor_x_position(e);
                }
            }
        }
    };


    // TIMESLIDER PLUGIN DEFINITION
    // ============================

    function Plugin(options, timecell) {
        return this.each(function() {
            var _this = $(this);
            var data = _this.data('timeslider');
            if (! data) {
                _this.data('timeslider', new TimeSlider(_this, options));
            }
            else {
                if (typeof options == 'string') {
                    switch (options) {
                        case 'add':
                            data.add_timecell(timecell);
                            break;

                        case 'toggle':
                            data.toggle_timecell(timecell);
                            break;

                        case 'remove':
                            data.remove_timecell(timecell);
                            break;

                        case 'remove_all':
                            data.remove_all_timecells();
                            break;
                    }
                }
                else {
                    data.set_options(options);
                }
            }
        });
    }

    var old = $.fn.TimeSlider;

    $.fn.TimeSlider = Plugin;
    $.fn.TimeSlider.VERSION = TimeSlider.VERSION;

    $.fn.TimeSlider.noConflict = function() {
        $.fn.TimeSlider = old;
        return this;
    };
})(jQuery);
