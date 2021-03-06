# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.errors import SuperdeskApiError
from superdesk.services import BaseService

from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource


class SavedActivityReportResource(Resource):
    """Saved Activity Report schema
    """

    schema = {
        'name': {
            'type': 'string',
            'required': True,
            'minlength': 1
        },
        'description': {
            'type': 'string'
        },
        'is_global': {
            'type': 'boolean',
            'default': False
        },
        'owner': Resource.rel('users', nullable=True),
        'operation': {
            'type': 'string',
            'required': True
        },
        'desk': Resource.rel('desks', nullable=True),
        'days': {'type': 'integer', 'required': True},
        'operation_end_date': {
            'type': 'datetime',
            'nullable': True
        },
        'subject': metadata_schema['subject'],
        'category': metadata_schema['anpa_category'],
        'keywords': metadata_schema['keywords'],
        'urgency_start': metadata_schema['urgency'],
        'urgency_end': metadata_schema['urgency'],
        'priority_start': metadata_schema['priority'],
        'priority_end': metadata_schema['priority'],
        'subscriber': {'type': 'string'},
        'group_by': {
            'type': 'dict'
        }
    }
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    resource_methods = ['GET', 'POST']
    privileges = {'POST': 'activity_report', 'PATCH': 'activity_report',
                  'PUT': 'activity_report', 'DELETE': 'activity_report'}


class SavedActivityReportService(BaseService):
    """Save activity reports service
    """

    def create(self, docs, **kwargs):
        for doc in docs:
            if doc.get('group_by', {}).get('desk') and doc.get('desk'):
                raise SuperdeskApiError.badRequestError('The desk must not be defined when group by is defined.')
            if not doc.get('group_by', {}).get('desk') and not doc.get('desk'):
                raise SuperdeskApiError.badRequestError('The desk is required when group by desk is false')
        return super().create(docs, **kwargs)
