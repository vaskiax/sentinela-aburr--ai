"""
Risk Level Classification for Sentinela Aburrá AI
Scale: 0-100
"""

def get_risk_level(risk_score: float) -> str:
    """
    Classify risk score (0-100) into categorical levels.
    
    Args:
        risk_score: Risk score from 0 to 100
        
    Returns:
        Risk level category as string
    """
    if risk_score >= 75:
        return "CRITICAL"
    elif risk_score >= 50:
        return "HIGH"
    elif risk_score >= 25:
        return "ELEVATED"
    elif risk_score >= 10:
        return "MODERATE"
    else:
        return "LOW"

def get_risk_color(risk_score: float) -> str:
    """
    Get color code for risk level visualization.
    
    Args:
        risk_score: Risk score from 0 to 100
        
    Returns:
        Color name for UI rendering
    """
    level = get_risk_level(risk_score)
    colors = {
        "CRITICAL": "red",
        "HIGH": "orange",
        "ELEVATED": "yellow",
        "MODERATE": "blue",
        "LOW": "green"
    }
    return colors.get(level, "gray")
