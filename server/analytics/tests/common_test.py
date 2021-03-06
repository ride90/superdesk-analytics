# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.tests import TestCase

from analytics.common import get_weekstart_offset_hr, get_utc_offset_in_minutes,\
    seconds_to_human_readable

from datetime import datetime


class CommonTestCase(TestCase):
    def test_weekstart_offset_hr(self):
        self.app.config['START_OF_WEEK'] = 0
        self.assertEqual(get_weekstart_offset_hr(), -24)

        self.app.config['START_OF_WEEK'] = 1
        self.assertEqual(get_weekstart_offset_hr(), 0)

        self.app.config['START_OF_WEEK'] = 2
        self.assertEqual(get_weekstart_offset_hr(), 24)

        self.app.config['START_OF_WEEK'] = 3
        self.assertEqual(get_weekstart_offset_hr(), 48)

        self.app.config['START_OF_WEEK'] = 4
        self.assertEqual(get_weekstart_offset_hr(), 72)

        self.app.config['START_OF_WEEK'] = 5
        self.assertEqual(get_weekstart_offset_hr(), 96)

        self.app.config['START_OF_WEEK'] = 6
        self.assertEqual(get_weekstart_offset_hr(), 120)

    def test_utc_offset_in_minutes(self):
        self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
        self.assertEqual(
            get_utc_offset_in_minutes(datetime(2018, 10, 1)),
            600
        )

        self.assertEqual(
            get_utc_offset_in_minutes(datetime(2018, 10, 10)),
            660
        )

    def test_seconds_to_human_readable(self):
        # Seconds
        self.assertEqual(seconds_to_human_readable(1), '1 second')
        self.assertEqual(seconds_to_human_readable(1.5), '1 second')
        self.assertEqual(seconds_to_human_readable(10), '10 seconds')

        # Minutes
        self.assertEqual(seconds_to_human_readable(60), '1 minute')
        self.assertEqual(seconds_to_human_readable(90), '1 minute')
        self.assertEqual(seconds_to_human_readable(120), '2 minutes')
        self.assertEqual(seconds_to_human_readable(150), '2 minutes')

        # Hours
        self.assertEqual(seconds_to_human_readable(3600), '1 hour')
        self.assertEqual(seconds_to_human_readable(5400), '1 hour')
        self.assertEqual(seconds_to_human_readable(7200), '2 hours')
        self.assertEqual(seconds_to_human_readable(9000), '2 hours')

        # Days
        self.assertEqual(seconds_to_human_readable(86400), '1 day')
        self.assertEqual(seconds_to_human_readable(129600), '1 day')
        self.assertEqual(seconds_to_human_readable(172800), '2 days')
        self.assertEqual(seconds_to_human_readable(216000), '2 days')
