# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource

from analytics.stats.stats_report_service import StatsReportService

from eve_elastic.elastic import parse_date


class UserActivityReportResource(Resource):
    """User Activity Report schema"""

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'user_activity_report'}


class UserActivityReportService(StatsReportService):
    repos = ['archive_statistics']
    date_filter_field = 'versioncreated'

    def get_request_aggregations(self, params, args):
        """Disable generating aggregations"""
        return None

    def _es_set_size(self, query, params):
        """Disable setting the size"""
        pass

    def generate_report(self, docs, args):
        report = {
            'items': [],
            'min': 0,
            'max': 0
        }

        for doc in docs:
            stats = doc.get('stats') or {}

            def calc_timestamp(entry):
                entry['operation_timestamp'] = parse_date(
                    entry.get('operation_created')
                ).timestamp()

                return entry

            timeline = [
                calc_timestamp(entry)
                for entry in stats.get('timeline') or []
            ]

            entry = {
                '_id': doc.get('_id'),
                'timeline': timeline,
                'slugline': doc.get('slugline') or '',
                'headline': doc.get('headline') or '',
                'activity': [],
            }

            locks = [
                lock for lock in timeline
                if lock.get('operation') in ['item_lock', 'item_unlock']
            ]

            user_id = ((args.get('params') or {}).get('must') or {}).get('user_locks')
            current_lock = None
            for lock in locks:
                # If this lock is not for the user provided in the argument filter
                # Then skip processing this lock entry
                if user_id != (lock.get('task') or {}).get('user'):
                    continue

                operation = lock.get('operation')
                created = lock.get('operation_timestamp')
                if current_lock is None:
                    if operation == 'item_lock':
                        current_lock = [created]
                elif operation == 'item_unlock':
                    current_lock.append(created)
                    entry['activity'].append(current_lock)

                    if report['min'] == 0 or current_lock[0] < report['min']:
                        report['min'] = current_lock[0]

                    if report['max'] == 0 or current_lock[1] > report['max']:
                        report['max'] = current_lock[1]

                    current_lock = None

            if len(entry['activity']) > 0:
                report['items'].append(entry)

        if len(report['items']) < 1:
            return {}

        return report