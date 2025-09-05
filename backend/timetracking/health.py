from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import mongoengine
from datetime import datetime

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    try:
        mongoengine.connection.get_db().command('ping')
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'service': 'trackme_backend'
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e),
            'service': 'trackme_backend'
        }, status=500)